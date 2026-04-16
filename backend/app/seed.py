import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.follow_up import FollowUp

INDUSTRIES = ["互联网", "金融", "制造", "教育", "医疗", "其他"]
SCALES = ["小型", "中型", "大型", "集团"]
SOURCES = ["官网", "转介绍", "广告", "展会", "电话", "其他"]
STATUSES = ["潜在", "活跃", "成交", "流失"]
STAGES = ["初步接触", "需求确认", "方案报价", "商务谈判", "赢单", "输单"]
PRIORITIES = ["高", "中", "低"]
FOLLOW_TYPES = ["电话", "邮件", "拜访", "会议", "其他"]

COMPANY_NAMES = [
    "星辰科技", "云帆网络", "智联数据", "鼎新金融", "华创制造",
    "博学教育", "康瑞医疗", "天宇信息", "锐思咨询", "盛达贸易",
    "蓝海科技", "汇通金服", "精工制造", "启明教育", "仁和医药",
    "飞跃互联", "中信投资", "宏图工业", "新知学堂", "安康生物",
]

CONTACT_NAMES = [
    "张伟", "李娜", "王强", "刘洋", "陈静",
    "杨帆", "赵磊", "黄丽", "周杰", "吴敏",
    "徐涛", "孙燕", "马超", "朱红", "胡明",
]

POSITIONS = ["CEO", "CTO", "VP销售", "采购经理", "技术总监", "项目经理"]


def random_date_in_last_n_months(n):
    now = datetime.now()
    start = now - timedelta(days=30 * n)
    delta = now - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)


def seed_data(db):
    if db.query(Customer).count() > 0:
        return

    customers = []
    for i, name in enumerate(COMPANY_NAMES):
        c = Customer(
            name=name,
            industry=INDUSTRIES[i % len(INDUSTRIES)],
            scale=random.choice(SCALES),
            source=random.choice(SOURCES),
            status=random.choice(STATUSES),
            region=random.choice(["北京", "上海", "广州", "深圳", "杭州", "成都"]),
            remark="{0}的备注信息".format(name),
            created_at=random_date_in_last_n_months(6),
        )
        c.updated_at = c.created_at
        db.add(c)
        customers.append(c)

    db.flush()

    for c in customers:
        num_contacts = random.randint(1, 3)
        for j in range(num_contacts):
            contact = Contact(
                customer_id=c.id,
                name=random.choice(CONTACT_NAMES),
                position=random.choice(POSITIONS),
                phone="138{0}".format(random.randint(10000000, 99999999)),
                email="contact{0}@example.com".format(random.randint(1, 999)),
                is_primary=(j == 0),
            )
            db.add(contact)

    db.flush()

    opportunities = []
    for i in range(30):
        c = random.choice(customers)
        opp = Opportunity(
            customer_id=c.id,
            title="{0} - 项目{1}".format(c.name, chr(65 + i % 26)),
            stage=random.choice(STAGES),
            amount=random.choice([1, 5, 10, 20, 50, 100, 200, 500]) * 10000,
            expected_close_date=date.today() + timedelta(days=random.randint(7, 180)),
            priority=random.choice(PRIORITIES),
            remark="销售机会备注{0}".format(i + 1),
            created_at=random_date_in_last_n_months(6),
        )
        opp.updated_at = opp.created_at
        db.add(opp)
        opportunities.append(opp)

    db.flush()

    for opp in opportunities:
        num_followups = random.randint(1, 5)
        for k in range(num_followups):
            fu = FollowUp(
                opportunity_id=opp.id,
                type=random.choice(FOLLOW_TYPES),
                content="第{0}次跟进：与客户沟通了项目进展和需求细节。".format(k + 1),
                next_plan="继续跟进，安排下次会议" if k < num_followups - 1 else None,
                created_at=opp.created_at + timedelta(days=k * 7),
            )
            db.add(fu)

    db.commit()
