import sys
import os
from datetime import date

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session

from app.db.session import engine
from app.models.user import User
from app.models.resume import Resume
from app.models.application import Application
from app.models.status_suggestion import StatusSuggestion
from app.core.security import hash_password

def run():
    with Session(engine) as session:
        email = "demo@test.com"

        user = session.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, hashed_password=hash_password("Demo@12345"))
            session.add(user)
            session.commit()
            session.refresh(user)

        resume = Resume(user_id=user.id, version_label="v1", tags=["demo"])
        session.add(resume)
        session.commit()
        session.refresh(resume)

        app1 = Application(
            user_id=user.id,
            company_name="F13 Technologies",
            role_title="AWS Cloud Intern",
            job_url="https://www.linkedin.com/jobs/view/4366863916/",
            platform="LinkedIn",
            location="India",
            job_type="Internship",
            company_type="cloud",
            role_category="Service",
            resume_id=resume.id,
            date_applied=date.today(),
            current_stage="CAPTURED",
        )
        session.add(app1)
        session.commit()
        session.refresh(app1)

        sug = StatusSuggestion(
            user_id=user.id,
            application_id=app1.id,
            suggested_stage="REJECTED",
            source_type="PORTAL",
            confidence=80,
            explanation="Demo suggestion from seed",
            status="PENDING",
        )
        session.add(sug)
        session.commit()

        print("Seed done:", {"email": email, "password": "Demo@12345", "application_id": app1.id})

if __name__ == "__main__":
    run()
