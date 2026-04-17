"""
CRM 后端单元测试
测试 Customer、Contact、Opportunity、FollowUp 模型和 API
"""
import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.customer import Customer
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.follow_up import FollowUp

# 测试数据库配置
TEST_DATABASE_URL = "sqlite:///./test_crm.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestCustomerModel:
    """测试 Customer 模型"""

    def test_create_customer(self, db):
        """测试创建客户"""
        customer = Customer(
            name="测试公司",
            industry="IT",
            scale="100-500人",
            source="官网",
            status="潜在",
            region="北京",
            address="朝阳区某街道",
            remark="测试备注"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        assert customer.id is not None
        assert customer.name == "测试公司"
        assert customer.industry == "IT"
        assert customer.status == "潜在"
        assert customer.created_at is not None

    def test_customer_default_status(self, db):
        """测试客户默认状态"""
        customer = Customer(
            name="新公司",
            industry="金融",
            scale="50人以下",
            source="推荐"
        )
        db.add(customer)
        db.commit()

        assert customer.status == "潜在"

    def test_customer_relationships(self, db):
        """测试客户关联关系"""
        customer = Customer(
            name="关联测试公司",
            industry="电商",
            scale="500-1000人",
            source="展会"
        )
        db.add(customer)
        db.commit()

        # 添加联系人
        contact = Contact(
            customer_id=customer.id,
            name="张三",
            position="经理",
            phone="13800138000",
            email="zhangsan@test.com",
            is_primary=True
        )
        db.add(contact)
        db.commit()

        # 添加商机
        opportunity = Opportunity(
            customer_id=customer.id,
            title="大额订单",
            stage="方案制定",
            amount=500000,
            expected_close_date=date(2026, 12, 31),
            priority="高"
        )
        db.add(opportunity)
        db.commit()

        # 验证关联
        assert len(customer.contacts) == 1
        assert len(customer.opportunities) == 1
        assert customer.contacts[0].name == "张三"
        assert customer.opportunities[0].title == "大额订单"


class TestContactModel:
    """测试 Contact 模型"""

    def test_create_contact(self, db):
        """测试创建联系人"""
        customer = Customer(
            name="测试公司",
            industry="IT",
            scale="100-500人",
            source="官网"
        )
        db.add(customer)
        db.commit()

        contact = Contact(
            customer_id=customer.id,
            name="李四",
            position="总监",
            phone="13900139000",
            email="lisi@test.com",
            is_primary=False
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)

        assert contact.id is not None
        assert contact.name == "李四"
        assert contact.is_primary is False

    def test_contact_belongs_to_customer(self, db):
        """测试联系人属于客户"""
        customer = Customer(
            name="公司A",
            industry="制造",
            scale="1000人以上",
            source="客户转化"
        )
        db.add(customer)
        db.commit()

        contact = Contact(
            customer_id=customer.id,
            name="王五",
            position="采购"
        )
        db.add(contact)
        db.commit()

        assert contact.customer.id == customer.id
        assert contact.customer.name == "公司A"


class TestOpportunityModel:
    """测试 Opportunity 模型"""

    def test_create_opportunity(self, db):
        """测试创建商机"""
        customer = Customer(
            name="测试公司",
            industry="IT",
            scale="100-500人",
            source="官网"
        )
        db.add(customer)
        db.commit()

        opportunity = Opportunity(
            customer_id=customer.id,
            title="软件采购项目",
            stage="初步接触",
            amount=1000000,
            expected_close_date=date(2026, 6, 30),
            priority="高",
            remark="重点客户"
        )
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)

        assert opportunity.id is not None
        assert opportunity.title == "软件采购项目"
        assert opportunity.amount == 1000000
        assert opportunity.priority == "高"
        assert opportunity.stage == "初步接触"

    def test_opportunity_default_values(self, db):
        """测试商机默认值"""
        customer = Customer(
            name="新客户",
            industry="教育",
            scale="50人以下",
            source="线上推广"
        )
        db.add(customer)
        db.commit()

        opportunity = Opportunity(
            customer_id=customer.id,
            title="培训项目"
        )
        db.add(opportunity)
        db.commit()

        assert opportunity.stage == "初步接触"
        assert opportunity.amount == 0
        assert opportunity.priority == "中"


class TestFollowUpModel:
    """测试 FollowUp 模型"""

    def test_create_follow_up(self, db):
        """测试创建跟进记录"""
        customer = Customer(
            name="测试公司",
            industry="IT",
            scale="100-500人",
            source="官网"
        )
        db.add(customer)
        db.commit()

        opportunity = Opportunity(
            customer_id=customer.id,
            title="测试项目",
            stage="初步接触"
        )
        db.add(opportunity)
        db.commit()

        follow_up = FollowUp(
            opportunity_id=opportunity.id,
            content="首次电话沟通，客户有兴趣",
            type="电话",
            next_plan="发送产品资料"
        )
        db.add(follow_up)
        db.commit()
        db.refresh(follow_up)

        assert follow_up.id is not None
        assert "电话" in follow_up.content
        assert follow_up.type == "电话"
        assert follow_up.next_plan == "发送产品资料"


class TestBusinessScenarios:
    """业务场景集成测试"""

    def test_full_customer_lifecycle(self, db):
        """测试完整客户生命周期"""
        # 1. 创建客户
        customer = Customer(
            name=" lifecycle 公司",
            industry="科技",
            scale="100-500人",
            source="展会"
        )
        db.add(customer)
        db.commit()

        # 2. 添加主要联系人
        primary_contact = Contact(
            customer_id=customer.id,
            name="赵六",
            position="CTO",
            phone="13700137000",
            email="cto@lifecycle.com",
            is_primary=True
        )
        db.add(primary_contact)
        db.commit()

        # 3. 创建商机
        opportunity = Opportunity(
            customer_id=customer.id,
            title="技术解决方案",
            stage="需求分析",
            amount=2000000,
            priority="高"
        )
        db.add(opportunity)
        db.commit()

        # 4. 添加跟进记录
        follow_up = FollowUp(
            opportunity_id=opportunity.id,
            content="客户确认需求，开始方案设计",
            type="会议",
            next_plan="提交技术方案"
        )
        db.add(follow_up)
        db.commit()

        # 5. 更新商机阶段
        opportunity.stage = "方案提交"
        db.commit()

        # 6. 验证完整数据
        assert customer.name == " lifecycle 公司"
        assert len(customer.contacts) == 1
        assert customer.contacts[0].is_primary is True
        assert len(customer.opportunities) == 1
        assert customer.opportunities[0].stage == "方案提交"
        assert len(customer.opportunities[0].follow_ups) == 1

    def test_cascade_delete(self, db):
        """测试级联删除"""
        customer = Customer(
            name="待删除公司",
            industry="零售",
            scale="50-100人",
            source="转介绍"
        )
        db.add(customer)
        db.commit()

        contact = Contact(
            customer_id=customer.id,
            name="删除测试"
        )
        db.add(contact)
        db.commit()

        opportunity = Opportunity(
            customer_id=customer.id,
            title="删除商机"
        )
        db.add(opportunity)
        db.commit()

        follow_up = FollowUp(
            opportunity_id=opportunity.id,
            content="测试内容"
        )
        db.add(follow_up)
        db.commit()

        customer_id = customer.id
        db.delete(customer)
        db.commit()

        # 验证级联删除
        assert db.query(Contact).filter(Contact.customer_id == customer_id).first() is None
        assert db.query(Opportunity).filter(Opportunity.customer_id == customer_id).first() is None
