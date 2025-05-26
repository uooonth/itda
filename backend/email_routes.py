from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
import random, string
import smtplib
from email.message import EmailMessage
from .db import User


router = APIRouter()

EMAIL_VERIFICATION_CODES = {}

def generate_code(length: int = 6):
    return ''.join(random.choices(string.digits, k=length))

def send_email(email: str, code: str):
    msg = EmailMessage()
    msg['Subject'] = "이메일 인증 코드"
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = email
    msg.set_content(f"인증 코드: {code}")

    try:
        if SMTP_SSL:
            with smtplib.SMTP_SSL(SMTP_Server, SMTP_PORT) as smtp:
                smtp.login(SMTP_ID, SMTP_PW)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_Server, SMTP_PORT) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.login(SMTP_ID, SMTP_PW)
                smtp.send_message(msg)
        print(f"[이메일 전송 성공] {email}")
    except Exception as e:
        print(f"[이메일 전송 실패] {e}")

class EmailRequest(BaseModel):
    email: EmailStr

@router.post("/send-code")
async def send_verification_email(data: EmailRequest, background_tasks: BackgroundTasks):
    code = generate_code(5) 
    EMAIL_VERIFICATION_CODES[data.email] = code
    background_tasks.add_task(send_email, data.email, code)
    return {"message": "인증코드 전송 완료"}

class EmailVerifyRequest(BaseModel):
    email: EmailStr
    code: str

@router.post("/verify-code")
async def verify_email(data: EmailVerifyRequest):
    stored = EMAIL_VERIFICATION_CODES.get(data.email)
    if not stored or stored != data.code:
        raise HTTPException(status_code=400, detail="인증 실패")
    del EMAIL_VERIFICATION_CODES[data.email]

    user = await User.objects.get_or_none(email=data.email)
    # if user:
    #     user.email_verified = True
    #     await user.update()

    return {"message": "인증 성공"}

# smtp 발송에 필요한 정보
SMTP_Server = 'smtp.gmail.com'
SMTP_ID = 'jongseoljeon@gmail.com'
SMTP_PW = 'uauc zqnx eieu rvrx'
SMTP_SSL = False
SMTP_PORT = 587
FROM_NAME = "itda(잇다)"
FROM_EMAIL = "jongseoljeon@gmail.com"