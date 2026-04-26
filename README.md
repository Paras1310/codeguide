# CodeGuide



CodeGuide is a beginner-to-intermediate JavaScript learning and practice platform.



It is designed around guided learning, not passive course watching. Learners study a concept, practice immediately, receive hints when stuck, fix mistakes, complete debugging challenges, submit a final mini project, and earn a QR-verifiable completion certificate.



\## Project Purpose



Most beginner coding platforms either provide static tutorials or generic exercises. CodeGuide focuses on a stricter learning flow:



```txt

Explain → Practice → Fail → Guided Hint → Fix → Track Progress → Final Project → Verified Certificate

```



The goal is to help beginners learn JavaScript with structure, feedback, and honest completion proof.



\## MVP Scope



This MVP focuses only on JavaScript.



It does not include Python, Java, C++, SQL, React lessons, Django lessons, video courses, paid APIs, or backend code execution.



\## Features



\### Authentication



\- User registration

\- User login

\- JWT-based authentication

\- Protected user dashboard

\- Duplicate email prevention

\- Case-insensitive email login and registration checks



\### Learning Path



\- JavaScript beginner-to-intermediate learning path

\- Lesson detail pages

\- Concept explanation

\- Syntax section

\- Examples

\- Common mistakes

\- Recap section



\### Practice System



\- Browser-based JavaScript challenge runner

\- No arbitrary user code execution on the backend

\- Test-case-based challenge validation

\- Required challenges

\- Debugging challenges

\- Mistake-based feedback

\- Hint ladder system



\### Progress Tracking



\- Completed lesson tracking

\- Passed required challenge tracking

\- Dashboard progress summary

\- Final project lock/unlock logic based on backend progress



\### Final Mini Project



\- Final JavaScript mini project requirement

\- Backend-controlled submission

\- Completion status tracking

\- Certificate eligibility requires final project completion



\### Certificate System



\- Verified Completion Certificate

\- Backend-controlled certificate eligibility

\- Unique certificate ID

\- Public certificate verification API

\- Public verification frontend page

\- QR code linking to public verification page

\- Printable certificate page

\- Browser-based Save as PDF support

\- Certificate status support: valid or revoked



\## Certificate Integrity



The downloaded or printed certificate is not the source of truth.



The public verification page is the source of truth. A certificate is valid only if the backend verification page confirms it.



The certificate does not claim government approval, accreditation, or official industry recognition.



\## Tech Stack



\### Frontend



\- React

\- Vite

\- Tailwind CSS

\- React Router

\- QR code generation with a free frontend library



\### Backend



\- Django

\- Django REST Framework

\- Simple JWT

\- PostgreSQL

\- django-environ

\- django-cors-headers



\### Security Choices



\- User JavaScript is executed only in the browser

\- Backend does not execute arbitrary learner code

\- Certificate eligibility is decided by the backend

\- Secrets are loaded from `.env`

\- `.env` files are ignored by Git

\- `.env.example` files are included for setup reference

\- Public verification does not expose user email or internal user ID



\## Project Structure



```txt

codeguide/

├── backend/

│   ├── accounts/

│   ├── config/

│   ├── learning/

│   ├── manage.py

│   ├── requirements.txt

│   ├── .env.example

│   └── .gitignore

│

├── frontend/

│   ├── src/

│   │   ├── api/

│   │   ├── auth/

│   │   ├── challenges/

│   │   └── pages/

│   │       └── user/

│   ├── package.json

│   ├── .env.example

│   └── .gitignore

│

└── README.md

```



\## Local Setup



\### 1. Clone the repository



```bash

git clone https://github.com/Paras1310/codeguide.git

cd codeguide

```



\### 2. Backend setup



```bash

cd backend

python -m venv .venv

```



Activate virtual environment on Windows PowerShell:



```powershell

.\\.venv\\Scripts\\Activate.ps1

```



Install dependencies:



```bash

pip install -r requirements.txt

```



Create local environment file:



```bash

copy .env.example .env

```



Update `.env` with your local PostgreSQL credentials.



Run migrations:



```bash

python manage.py migrate

```



Start backend:



```bash

python manage.py runserver

```



Backend runs at:



```txt

http://127.0.0.1:8000

```



Health check:



```txt

http://127.0.0.1:8000/api/health/

```



\### 3. Frontend setup



Open a new terminal:



```bash

cd frontend

npm install

```



Create local environment file:



```bash

copy .env.example .env

```



Start frontend:



```bash

npm run dev

```



Frontend runs at:



```txt

http://localhost:5173

```



\## Important Environment Files



Real environment files are not committed:



```txt

backend/.env

frontend/.env

```



Only examples are committed:



```txt

backend/.env.example

frontend/.env.example

```



\## Current MVP Status



Completed:



\- Authentication foundation

\- Learning content foundation

\- JavaScript challenge runner

\- Hint ladder system

\- Debugging challenges

\- Progress tracking

\- Final project submission

\- Certificate eligibility API

\- Certificate issuing

\- Public certificate verification

\- QR verification

\- Printable certificate page

\- Safe GitHub commit without secrets



Not included in MVP:



\- Paid AI help

\- Paid compiler APIs

\- Backend JavaScript execution

\- Video hosting

\- Multi-language support

\- Advanced admin dashboard

\- Official accreditation claims



\## Portfolio Value



CodeGuide demonstrates:



\- Full-stack application architecture

\- Secure authentication flow

\- REST API design

\- State-based learning progress

\- Browser-based code validation

\- Certificate integrity design

\- Public verification system

\- Practical security discipline

\- MVP-focused product thinking



\## License



This project is currently for portfolio and learning purposes.

