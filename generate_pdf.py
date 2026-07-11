import sys
import subprocess
import os

# Install reportlab if not available
try:
    import reportlab
except ImportError:
    print("Reportlab not found. Installing reportlab via pip...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    import reportlab

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def build_pdf(filename="LearnMate_Knowledge_Base.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#e05a47'),
        alignment=TA_LEFT,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#71717a'),
        alignment=TA_LEFT,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#e05a47'),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#27272a'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#71717a'),
        spaceBefore=6,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#3f3f46'),
        spaceAfter=6
    )

    link_style = ParagraphStyle(
        'LinkText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=4
    )

    story = []
    
    # Header Title Section
    story.append(Paragraph("LearnMate Core Coach Knowledge Base & Roadmaps", title_style))
    story.append(Paragraph("Master configuration, behavior rules, diagnostic quizzes, and curated syllabi.", subtitle_style))
    
    # Divider line
    divider = Table([['']], colWidths=[doc.width])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#e4e4e7')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))

    # SECTION 1: COACH SYSTEM INSTRUCTIONS & BEHAVIOR
    story.append(Paragraph("1. Agent Persona & Guidelines", h1_style))
    
    guidelines = [
        "<b>Role:</b> You are LearnMate, a personal course roadmap coach. Your job is to help students figure out the right learning path for their interest area, using only the roadmap data provided in this knowledge base.",
        "<b>Start Phase:</b> Always treat the student's chosen track (provided in the system message) as decided. Do not ask them which track they want. If the track is not supported, politely list the available tracks.",
        "<b>Diagnostic Skill Assessment:</b> Before placing a student in a stage, ask the 4 assessment questions for the Beginner stage of their track, one at a time. If they answer 'yes' to 3 or 4 of them, ask the Intermediate stage questions to verify. Continue until you find the stage where they answer 'no' to most questions - that is their starting stage.",
        "<b>Presenting One Stage at a Time:</b> Present only one stage at a time, not the whole roadmap at once. Give them the topics, resources, and milestone project for their current stage only.",
        "<b>Next Steps:</b> After presenting a stage, ask whether they've completed the milestone project for it before moving them to the next stage.",
        "<b>Consistency:</b> Use only the provided course names, topics, resources, and milestone projects in this document. Do not invent external resources.",
        "<b>Tone:</b> Keep responses encouraging, direct, and concise."
    ]
    for g in guidelines:
        story.append(Paragraph(f"• {g}", body_style))
    
    story.append(Spacer(1, 10))

    # SECTION 2: OUTPUT FORMAT
    story.append(Paragraph("2. Required Response Output Format", h1_style))
    story.append(Paragraph("When presenting a stage or roadmap to the student, you MUST use the following format exactly:", body_style))
    
    format_text = (
        "<b>Track:</b> [Track Name]<br/>"
        "<b>Current Stage:</b> [Beginner / Intermediate / Advanced]<br/><br/>"
        "<b>Topics to focus on:</b><br/>"
        "- topic 1<br/>"
        "- topic 2<br/><br/>"
        "<b>Recommended resources:</b><br/>"
        "- resource 1<br/>"
        "- resource 2<br/><br/>"
        "<b>Milestone project:</b> [project description]<br/><br/>"
        "<b>Next step:</b> [one line prompting them to report back once they've done the milestone]"
    )
    story.append(Paragraph(format_text, body_style))
    story.append(Spacer(1, 15))

    # SECTION 3: ROADMAP SYLLABUS & DIAGNOSTIC QUESTIONS
    story.append(Paragraph("3. Learning Track Syllabi & Quizzes", h1_style))

    tracks_data = [
        {
            "track": "Frontend Development",
            "stages": {
                "Beginner": {
                    "questions": [
                        "Can you build a webpage layout using Flexbox or Grid without looking up the syntax?",
                        "Do you know the difference between block, inline, and inline-block elements?",
                        "Can you write a JavaScript function that manipulates the DOM (e.g., changes text on button click)?",
                        "Have you built at least one static webpage from scratch (HTML + CSS only)?"
                    ],
                    "topics": [
                        "HTML5 semantic elements (header, nav, main, section, article, footer)",
                        "CSS fundamentals - box model, positioning, display, selectors",
                        "Flexbox and CSS Grid layout basics",
                        "JavaScript basics - variables, functions, loops, DOM manipulation",
                        "Responsive design with media queries",
                        "Version control basics with Git"
                    ],
                    "resources": [
                        ("freeCodeCamp - Responsive Web Design Certification", "https://www.freecodecamp.org/learn/2022/responsive-web-design/"),
                        ("MDN Web Docs - HTML, CSS, and JavaScript guides", "https://developer.mozilla.org/"),
                        ("The Odin Project - Foundations course", "https://www.theodinproject.com/"),
                        ("CSS-Tricks - A Complete Guide to Flexbox & Grid", "https://css-tricks.com/"),
                        ("JavaScript.info - The Modern JavaScript Tutorial", "https://javascript.info/")
                    ],
                    "project": "Build a fully responsive personal portfolio website using only HTML, CSS, and vanilla JavaScript. It should include a navigation bar, hero section, projects gallery, and a contact form."
                },
                "Intermediate": {
                    "questions": [
                        "Have you built a project using a frontend framework like React, Vue, or Angular?",
                        "Can you explain how component state management works (e.g., useState, props drilling)?",
                        "Are you comfortable with API calls (fetch/axios) and handling async data in the UI?",
                        "Have you used a CSS preprocessor (Sass/LESS) or a utility framework (Tailwind CSS)?"
                    ],
                    "topics": [
                        "React.js fundamentals - components, props, state, hooks (useState, useEffect)",
                        "Client-side routing with React Router",
                        "Working with REST APIs - fetch, axios, error handling, loading states",
                        "CSS-in-JS or Tailwind CSS for scalable styling",
                        "State management patterns - Context API, useReducer",
                        "Build tools - Vite, Webpack basics",
                        "Testing basics - Jest, React Testing Library"
                    ],
                    "resources": [
                        ("React official docs - react.dev tutorial", "https://react.dev/"),
                        ("Scrimba - Learn React for Free", "https://scrimba.com/learn/learnreact"),
                        ("Tailwind CSS documentation", "https://tailwindcss.com/"),
                        ("freeCodeCamp - Front End Libraries Certification", "https://www.freecodecamp.org/learn/front-end-development-libraries/")
                    ],
                    "project": "Build a dynamic web app (e.g., a task manager, weather dashboard, or movie search app) using React. It must fetch data from a public API, have multiple routes, and use a modern CSS approach like Tailwind."
                },
                "Advanced": {
                    "questions": [
                        "Have you worked with Next.js or another SSR/SSG framework?",
                        "Can you set up CI/CD pipelines and deploy frontend apps to production?",
                        "Are you familiar with advanced state management (Redux, Zustand, or Jotai)?",
                        "Have you optimized web performance (code splitting, lazy loading, lighthouse audits)?"
                    ],
                    "topics": [
                        "Next.js - SSR, SSG, ISR, API routes, middleware",
                        "Advanced state management - Redux Toolkit, Zustand",
                        "Performance optimization - code splitting, lazy loading, memoization",
                        "TypeScript for type-safe React development",
                        "Testing strategies - E2E with Cypress/Playwright, unit & integration tests",
                        "CI/CD, Docker basics, and deployment (Vercel, Netlify, AWS)",
                        "Web accessibility (WCAG) and SEO fundamentals"
                    ],
                    "resources": [
                        ("Next.js official docs and Learn course", "https://nextjs.org/learn"),
                        ("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
                        ("web.dev - Performance and Core Web Vitals guides", "https://web.dev/"),
                        ("Frontend Masters - Advanced React Patterns", "https://frontendmasters.com/")
                    ],
                    "project": "Build and deploy a full-stack Next.js application (e.g., a blog platform or SaaS dashboard) with SSR, authentication, a database, TypeScript, CI/CD pipeline, and a Lighthouse performance score above 90."
                }
            }
        },
        {
            "track": "Cybersecurity",
            "stages": {
                "Beginner": {
                    "questions": [
                        "Do you understand the difference between symmetric and asymmetric encryption?",
                        "Can you explain what a firewall does and name at least one type?",
                        "Are you familiar with common attack types like phishing, SQL injection, or XSS?",
                        "Have you used any Linux command-line tools for basic system administration?"
                    ],
                    "topics": [
                        "Networking fundamentals - TCP/IP, DNS, HTTP/HTTPS, ports",
                        "Operating system basics - Linux command line, file permissions",
                        "Introduction to cryptography - hashing, symmetric & asymmetric encryption",
                        "Common threats - malware, phishing, social engineering, DDoS",
                        "CIA triad (Confidentiality, Integrity, Availability)",
                        "Basic security tools - Wireshark, Nmap (intro level)"
                    ],
                    "resources": [
                        ("Cisco Networking Academy - Introduction to Cybersecurity", "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity"),
                        ("TryHackMe - Pre Security and Intro paths", "https://tryhackme.com/"),
                        ("Professor Messer - CompTIA Security+ video series", "https://www.professormesser.com/"),
                        ("OverTheWire - Bandit wargame", "https://overthewire.org/wargames/bandit/"),
                        ("OWASP - Top 10 Web Application Security Risks", "https://owasp.org/www-project-top-ten/")
                    ],
                    "project": "Complete the TryHackMe 'Pre Security' learning path and write a summary report of the key concepts learned, including networking, Linux basics, and web security fundamentals."
                },
                "Intermediate": {
                    "questions": [
                        "Can you perform basic penetration testing using tools like Burp Suite or Metasploit?",
                        "Have you analyzed network traffic captures using Wireshark?",
                        "Are you comfortable writing scripts (Python/Bash) for security automation?",
                        "Do you understand how vulnerabilities like buffer overflow or privilege escalation work?"
                    ],
                    "topics": [
                        "Penetration testing methodology - reconnaissance, scanning, exploitation, reporting",
                        "Web application security - OWASP Top 10 in depth, Burp Suite",
                        "Network security - packet analysis, IDS/IPS, VPNs",
                        "Scripting for security - Python and Bash automation",
                        "Vulnerability assessment and management",
                        "Incident response fundamentals"
                    ],
                    "resources": [
                        ("TryHackMe - Jr Penetration Tester", "https://tryhackme.com/"),
                        ("Hack The Box - Starting Point and Easy machines", "https://www.hackthebox.com/"),
                        ("PortSwigger Web Security Academy", "https://portswigger.net/web-security"),
                        ("SANS Cyber Aces - Free online courses", "https://www.cyberaces.org/")
                    ],
                    "project": "Complete 5 Hack The Box or TryHackMe machines (Easy/Medium), document your methodology for each, and create a penetration testing report for one of them following industry-standard format."
                },
                "Advanced": {
                    "questions": [
                        "Have you performed a full penetration test on a real or simulated enterprise environment?",
                        "Can you write custom exploits or modify existing ones for specific targets?",
                        "Are you familiar with cloud security (AWS/Azure security configurations)?",
                        "Have you worked on incident response, digital forensics, or threat hunting?"
                    ],
                    "topics": [
                        "Advanced exploitation - custom exploit development, binary exploitation",
                        "Cloud security - AWS/Azure/GCP security best practices and misconfigurations",
                        "Threat hunting and threat intelligence frameworks (MITRE ATT&CK)",
                        "Digital forensics - memory analysis, disk forensics, log analysis",
                        "Security architecture and zero-trust models",
                        "Compliance frameworks - NIST, ISO 27001, SOC 2",
                        "Red team vs. Blue team operations"
                    ],
                    "resources": [
                        ("Hack The Box - Pro Labs", "https://www.hackthebox.com/"),
                        ("OWASP Advanced Resources", "https://owasp.org/"),
                        ("AWS Security Specialty Study Guide", "https://aws.amazon.com/certification/certified-security-specialty/")
                    ],
                    "project": "Conduct a full red team engagement on a simulated enterprise network (e.g., Hack The Box Pro Labs), produce a professional penetration testing report, and present remediation recommendations."
                }
            }
        },
        {
            "track": "Data Science",
            "stages": {
                "Beginner": {
                    "questions": [
                        "Can you write basic Python code (variables, loops, functions, lists)?",
                        "Do you understand basic statistics concepts (mean, median, standard deviation)?",
                        "Have you used any data analysis library like Pandas or NumPy?",
                        "Have you created any basic data visualizations (matplotlib, Excel charts, etc.)?"
                    ],
                    "topics": [
                        "Python programming fundamentals for data science",
                        "Statistics and probability basics - descriptive stats, distributions",
                        "Data manipulation with Pandas - DataFrames, filtering, grouping",
                        "NumPy for numerical computing",
                        "Data visualization with Matplotlib and Seaborn",
                        "Jupyter Notebooks workflow",
                        "Data cleaning and preprocessing basics"
                    ],
                    "resources": [
                        ("Kaggle - Python and Intro to Machine Learning", "https://www.kaggle.com/learn"),
                        ("freeCodeCamp - Data Analysis with Python Certification", "https://www.freecodecamp.org/learn/data-analysis-with-python/"),
                        ("Khan Academy - Statistics and Probability", "https://www.khanacademy.org/math/statistics-probability")
                    ],
                    "project": "Perform exploratory data analysis (EDA) on a real-world dataset from Kaggle. Clean the data, compute summary statistics, create at least 5 meaningful visualizations, and write a Jupyter notebook documenting your findings."
                },
                "Intermediate": {
                    "questions": [
                        "Can you build and evaluate a machine learning model (e.g., linear regression, decision tree)?",
                        "Are you familiar with train/test splitting, cross-validation, and overfitting?",
                        "Have you used scikit-learn for building ML pipelines?",
                        "Can you perform feature engineering and handle missing data in a dataset?"
                    ],
                    "topics": [
                        "Supervised learning - linear/logistic regression, decision trees, random forests, SVM",
                        "Unsupervised learning - K-means clustering, PCA, dimensionality reduction",
                        "Model evaluation - accuracy, precision, recall, F1, ROC-AUC, confusion matrix",
                        "Feature engineering and selection techniques",
                        "scikit-learn pipelines and model tuning (GridSearchCV)",
                        "SQL for data querying and joins",
                        "Introduction to deep learning concepts"
                    ],
                    "resources": [
                        ("Coursera - Andrew Ng's Machine Learning Specialization", "https://www.coursera.org/specializations/machine-learning-introduction"),
                        ("Kaggle - Intermediate Machine Learning", "https://www.kaggle.com/learn"),
                        ("Mode Analytics - SQL tutorial for data analysis", "https://mode.com/sql-tutorial/"),
                        ("StatQuest YouTube channel", "https://www.youtube.com/c/joshstarmer")
                    ],
                    "project": "Build an end-to-end ML project: pick a Kaggle competition dataset, perform EDA, engineer features, train and compare at least 3 different models, tune hyperparameters, and submit your predictions to the Kaggle leaderboard."
                },
                "Advanced": {
                    "questions": [
                        "Have you built and trained deep learning models using TensorFlow or PyTorch?",
                        "Can you design and deploy an ML model as an API or web service?",
                        "Are you familiar with NLP techniques (tokenization, embeddings, transformers)?",
                        "Have you worked with big data tools like Spark, or cloud ML platforms (AWS SageMaker, GCP Vertex AI)?"
                    ],
                    "topics": [
                        "Deep learning - CNNs, RNNs, Transformers, attention mechanisms",
                        "Natural Language Processing - text preprocessing, word embeddings, BERT/GPT",
                        "Computer vision - image classification, object detection",
                        "MLOps - model deployment, monitoring, CI/CD for ML",
                        "Big data tools - Apache Spark, Hadoop basics",
                        "Cloud ML platforms - AWS SageMaker, Google Vertex AI, Azure ML",
                        "Ethics and fairness in AI"
                    ],
                    "resources": [
                        ("fast.ai - Practical Deep Learning for Coders", "https://www.fast.ai/"),
                        ("Hugging Face - NLP course and Transformers library docs", "https://huggingface.co/learn/nlp-course"),
                        ("Full Stack Deep Learning course", "https://fullstackdeeplearning.com/")
                    ],
                    "project": "Build and deploy a deep learning application (e.g., image classifier, text summarizer, or chatbot) using PyTorch or TensorFlow. Deploy it as a web API with Flask/FastAPI and host it on a cloud platform."
                }
            }
        },
        {
            "track": "Python Programming",
            "stages": {
                "Beginner": {
                    "questions": [
                        "Can you write a Python function that takes parameters and returns a value?",
                        "Do you understand Python data types (strings, lists, dictionaries, tuples)?",
                        "Can you use control flow statements (if/elif/else, for loops, while loops)?",
                        "Have you written and run a complete Python script (not just in a REPL)?"
                    ],
                    "topics": [
                        "Python syntax and data types - strings, numbers, booleans",
                        "Data structures - lists, tuples, dictionaries, sets",
                        "Control flow - conditionals, loops, comprehensions",
                        "Functions - parameters, return values, scope, lambda functions",
                        "File I/O - reading and writing text/CSV files",
                        "Error handling - try/except, custom exceptions",
                        "Modules and packages - import system, pip basics"
                    ],
                    "resources": [
                        ("Python.org official tutorial", "https://docs.python.org/3/tutorial/"),
                        ("Automate the Boring Stuff with Python", "https://automatetheboringstuff.com/"),
                        ("freeCodeCamp - Scientific Computing with Python", "https://www.freecodecamp.org/learn/scientific-computing-with-python/")
                    ],
                    "project": "Build a command-line application (e.g., to-do list manager, quiz game, or expense tracker) in Python that reads/writes data to a file and uses functions, error handling, and at least one external library."
                },
                "Intermediate": {
                    "questions": [
                        "Can you write Python classes with inheritance, encapsulation, and methods?",
                        "Have you used Python libraries like requests, Flask, or SQLAlchemy?",
                        "Do you understand decorators, generators, and context managers?",
                        "Can you write unit tests for your Python code using pytest or unittest?"
                    ],
                    "topics": [
                        "Object-oriented programming - classes, inheritance, polymorphism, magic methods",
                        "Decorators, generators, and iterators",
                        "Context managers and the 'with' statement",
                        "Working with APIs using the requests library",
                        "Database interactions - SQLite, SQLAlchemy ORM",
                        "Web development basics with Flask or FastAPI",
                        "Testing - pytest, mocking, test-driven development",
                        "Virtual environments and dependency management"
                    ],
                    "resources": [
                        ("Real Python - Python Tutorials", "https://realpython.com/"),
                        ("Corey Schafer YouTube channel", "https://www.youtube.com/user/schafer5"),
                        ("FastAPI official documentation", "https://fastapi.tiangolo.com/")
                    ],
                    "project": "Build a REST API using Flask or FastAPI with a database backend (SQLite or PostgreSQL). Include user authentication, CRUD operations, input validation, error handling, and write unit tests for all endpoints."
                },
                "Advanced": {
                    "questions": [
                        "Can you design and implement concurrent/parallel programs (asyncio, threading, multiprocessing)?",
                        "Have you built and deployed a production Python application?",
                        "Are you familiar with design patterns and software architecture in Python?",
                        "Can you profile and optimize Python code for performance?"
                    ],
                    "topics": [
                        "Concurrency - asyncio, threading, multiprocessing, async/await",
                        "Design patterns - singleton, factory, observer, strategy in Python",
                        "Advanced OOP - metaclasses, descriptors, ABCs",
                        "Performance profiling and optimization - cProfile, line_profiler",
                        "Packaging and distributing Python projects (setuptools, PyPI)",
                        "CI/CD pipelines for Python projects",
                        "System design and microservices architecture"
                    ],
                    "resources": [
                        ("Architecture Patterns with Python (book)", "https://cosmicpython.com/"),
                        ("Python Cookbook", "https://www.oreilly.com/library/view/python-cookbook-3rd/9781449357337/"),
                        ("Real Python advanced asyncio tutorials", "https://realpython.com/async-io-python/")
                    ],
                    "project": "Design and build a production-grade Python application (e.g., a distributed task queue, real-time data pipeline, or microservice) using advanced patterns. Include async I/O, comprehensive tests, Docker deployment, CI/CD, and documentation."
                }
            }
        }
    ]

    for item in tracks_data:
        story.append(Paragraph(item["track"], h2_style))
        
        for stage, content in item["stages"].items():
            story.append(Paragraph(f"{stage} Stage Details", h3_style))
            
            # Diagnostic quiz questions
            story.append(Paragraph("Diagnostic Quiz Questions", section_title_style := ParagraphStyle('SecTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#71717a'), spaceBefore=4, spaceAfter=2)))
            for idx, q in enumerate(content["questions"]):
                story.append(Paragraph(f"{idx+1}. {q}", body_style))
            story.append(Spacer(1, 2))
            
            # Topics
            story.append(Paragraph("Syllabus & Core Topics", section_title_style))
            for topic in content["topics"]:
                story.append(Paragraph(f"• {topic}", body_style))
            story.append(Spacer(1, 2))
            
            # Resources
            story.append(Paragraph("Free Study Resources", section_title_style))
            for name, url in content["resources"]:
                text_with_link = f"• {name} - <font color='#2563eb'><u><a href='{url}'>{url}</a></u></font>"
                story.append(Paragraph(text_with_link, link_style))
            story.append(Spacer(1, 2))
            
            # Project
            story.append(Paragraph("Milestone Assessment Project", section_title_style))
            story.append(Paragraph(content["project"], body_style))
            story.append(Spacer(1, 10))
            
        story.append(Spacer(1, 10))

    # Build the document
    doc.build(story)
    print(f"PDF successfully generated at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    build_pdf()
