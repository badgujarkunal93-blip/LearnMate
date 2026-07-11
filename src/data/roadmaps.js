// LearnMate Roadmap Knowledge Base
// All track data, assessment questions, topics, resources, and milestone projects
// are defined here so the quiz flow is 100% local and reliable.

export const TRACKS = {
  "Frontend Development": {
    stages: {
      Beginner: {
        assessmentQuestions: [
          "Can you build a webpage layout using Flexbox or Grid without looking up the syntax?",
          "Do you know the difference between block, inline, and inline-block elements?",
          "Can you write a JavaScript function that manipulates the DOM (e.g., changes text on button click)?",
          "Have you built at least one static webpage from scratch (HTML + CSS only)?"
        ],
        topics: [
          "HTML5 semantic elements (header, nav, main, section, article, footer)",
          "CSS fundamentals — box model, positioning, display, selectors",
          "Flexbox and CSS Grid layout basics",
          "JavaScript basics — variables, functions, loops, DOM manipulation",
          "Responsive design with media queries",
          "Version control basics with Git"
        ],
        resources: [
          "freeCodeCamp — Responsive Web Design Certification",
          "MDN Web Docs — HTML, CSS, and JavaScript guides",
          "The Odin Project — Foundations course",
          "CSS-Tricks — A Complete Guide to Flexbox & Grid",
          "JavaScript.info — The Modern JavaScript Tutorial (Part 1)"
        ],
        milestoneProject: "Build a fully responsive personal portfolio website using only HTML, CSS, and vanilla JavaScript. It should include a navigation bar, hero section, projects gallery, and a contact form."
      },
      Intermediate: {
        assessmentQuestions: [
          "Have you built a project using a frontend framework like React, Vue, or Angular?",
          "Can you explain how component state management works (e.g., useState, props drilling)?",
          "Are you comfortable with API calls (fetch/axios) and handling async data in the UI?",
          "Have you used a CSS preprocessor (Sass/LESS) or a utility framework (Tailwind CSS)?"
        ],
        topics: [
          "React.js fundamentals — components, props, state, hooks (useState, useEffect)",
          "Client-side routing with React Router",
          "Working with REST APIs — fetch, axios, error handling, loading states",
          "CSS-in-JS or Tailwind CSS for scalable styling",
          "State management patterns — Context API, useReducer",
          "Build tools — Vite, Webpack basics",
          "Testing basics — Jest, React Testing Library"
        ],
        resources: [
          "React official docs — react.dev tutorial",
          "Scrimba — Learn React for Free",
          "Tailwind CSS documentation and Tailwind UI",
          "Kent C. Dodds — Epic React (free intro modules)",
          "freeCodeCamp — Front End Libraries Certification"
        ],
        milestoneProject: "Build a dynamic web app (e.g., a task manager, weather dashboard, or movie search app) using React. It must fetch data from a public API, have multiple routes, and use a modern CSS approach like Tailwind."
      },
      Advanced: {
        assessmentQuestions: [
          "Have you worked with Next.js or another SSR/SSG framework?",
          "Can you set up CI/CD pipelines and deploy frontend apps to production?",
          "Are you familiar with advanced state management (Redux, Zustand, or Jotai)?",
          "Have you optimized web performance (code splitting, lazy loading, lighthouse audits)?"
        ],
        topics: [
          "Next.js — SSR, SSG, ISR, API routes, middleware",
          "Advanced state management — Redux Toolkit, Zustand",
          "Performance optimization — code splitting, lazy loading, memoization",
          "TypeScript for type-safe React development",
          "Testing strategies — E2E with Cypress/Playwright, unit & integration tests",
          "CI/CD, Docker basics, and deployment (Vercel, Netlify, AWS)",
          "Web accessibility (WCAG) and SEO fundamentals"
        ],
        resources: [
          "Next.js official docs and Learn course (nextjs.org/learn)",
          "TypeScript Handbook (typescriptlang.org)",
          "web.dev — Performance and Core Web Vitals guides",
          "Testing JavaScript by Kent C. Dodds",
          "Frontend Masters — Advanced React Patterns"
        ],
        milestoneProject: "Build and deploy a full-stack Next.js application (e.g., a blog platform or SaaS dashboard) with SSR, authentication, a database, TypeScript, CI/CD pipeline, and a Lighthouse performance score above 90."
      }
    }
  },

  "Cybersecurity": {
    stages: {
      Beginner: {
        assessmentQuestions: [
          "Do you understand the difference between symmetric and asymmetric encryption?",
          "Can you explain what a firewall does and name at least one type?",
          "Are you familiar with common attack types like phishing, SQL injection, or XSS?",
          "Have you used any Linux command-line tools for basic system administration?"
        ],
        topics: [
          "Networking fundamentals — TCP/IP, DNS, HTTP/HTTPS, ports",
          "Operating system basics — Linux command line, file permissions",
          "Introduction to cryptography — hashing, symmetric & asymmetric encryption",
          "Common threats — malware, phishing, social engineering, DDoS",
          "CIA triad (Confidentiality, Integrity, Availability)",
          "Basic security tools — Wireshark, Nmap (intro level)"
        ],
        resources: [
          "Cisco Networking Academy — Introduction to Cybersecurity",
          "TryHackMe — Pre Security and Introduction to Cyber Security paths",
          "Professor Messer — CompTIA Security+ video series (free on YouTube)",
          "OverTheWire — Bandit wargame (Linux command-line practice)",
          "OWASP — Top 10 Web Application Security Risks"
        ],
        milestoneProject: "Complete the TryHackMe 'Pre Security' learning path and write a summary report of the key concepts learned, including networking, Linux basics, and web security fundamentals."
      },
      Intermediate: {
        assessmentQuestions: [
          "Can you perform basic penetration testing using tools like Burp Suite or Metasploit?",
          "Have you analyzed network traffic captures using Wireshark?",
          "Are you comfortable writing scripts (Python/Bash) for security automation?",
          "Do you understand how vulnerabilities like buffer overflow or privilege escalation work?"
        ],
        topics: [
          "Penetration testing methodology — reconnaissance, scanning, exploitation, reporting",
          "Web application security — OWASP Top 10 in depth, Burp Suite",
          "Network security — packet analysis, IDS/IPS, VPNs",
          "Scripting for security — Python and Bash automation",
          "Vulnerability assessment and management",
          "Incident response fundamentals"
        ],
        resources: [
          "TryHackMe — Jr Penetration Tester and Offensive Pentesting paths",
          "Hack The Box — Starting Point and Easy machines",
          "PortSwigger Web Security Academy (free labs)",
          "Black Hat Python (book) by Justin Seitz",
          "SANS Cyber Aces — free online courses"
        ],
        milestoneProject: "Complete 5 Hack The Box or TryHackMe machines (Easy/Medium), document your methodology for each, and create a penetration testing report for one of them following industry-standard format."
      },
      Advanced: {
        assessmentQuestions: [
          "Have you performed a full penetration test on a real or simulated enterprise environment?",
          "Can you write custom exploits or modify existing ones for specific targets?",
          "Are you familiar with cloud security (AWS/Azure security configurations)?",
          "Have you worked on incident response, digital forensics, or threat hunting?"
        ],
        topics: [
          "Advanced exploitation — custom exploit development, binary exploitation",
          "Cloud security — AWS/Azure/GCP security best practices and misconfigurations",
          "Threat hunting and threat intelligence frameworks (MITRE ATT&CK)",
          "Digital forensics — memory analysis, disk forensics, log analysis",
          "Security architecture and zero-trust models",
          "Compliance frameworks — NIST, ISO 27001, SOC 2",
          "Red team vs. Blue team operations"
        ],
        resources: [
          "Offensive Security — OSCP certification prep materials",
          "SANS Institute — advanced courses (GPEN, GCIH, GWAPT)",
          "Hack The Box — Pro Labs (Dante, Offshore)",
          "Malware analysis resources — Practical Malware Analysis (book)",
          "AWS Security Specialty certification study guide"
        ],
        milestoneProject: "Conduct a full red team engagement on a simulated enterprise network (e.g., Hack The Box Pro Labs), produce a professional penetration testing report, and present remediation recommendations."
      }
    }
  },

  "Data Science": {
    stages: {
      Beginner: {
        assessmentQuestions: [
          "Can you write basic Python code (variables, loops, functions, lists)?",
          "Do you understand basic statistics concepts (mean, median, standard deviation)?",
          "Have you used any data analysis library like Pandas or NumPy?",
          "Have you created any basic data visualizations (matplotlib, Excel charts, etc.)?"
        ],
        topics: [
          "Python programming fundamentals for data science",
          "Statistics and probability basics — descriptive stats, distributions",
          "Data manipulation with Pandas — DataFrames, filtering, grouping",
          "NumPy for numerical computing",
          "Data visualization with Matplotlib and Seaborn",
          "Jupyter Notebooks workflow",
          "Data cleaning and preprocessing basics"
        ],
        resources: [
          "Kaggle — Python and Intro to Machine Learning micro-courses",
          "freeCodeCamp — Data Analysis with Python Certification",
          "Khan Academy — Statistics and Probability",
          "Coursera — IBM Data Science Professional Certificate (audit free)",
          "Python for Data Analysis (book) by Wes McKinney"
        ],
        milestoneProject: "Perform exploratory data analysis (EDA) on a real-world dataset from Kaggle. Clean the data, compute summary statistics, create at least 5 meaningful visualizations, and write a Jupyter notebook documenting your findings."
      },
      Intermediate: {
        assessmentQuestions: [
          "Can you build and evaluate a machine learning model (e.g., linear regression, decision tree)?",
          "Are you familiar with train/test splitting, cross-validation, and overfitting?",
          "Have you used scikit-learn for building ML pipelines?",
          "Can you perform feature engineering and handle missing data in a dataset?"
        ],
        topics: [
          "Supervised learning — linear/logistic regression, decision trees, random forests, SVM",
          "Unsupervised learning — K-means clustering, PCA, dimensionality reduction",
          "Model evaluation — accuracy, precision, recall, F1, ROC-AUC, confusion matrix",
          "Feature engineering and selection techniques",
          "scikit-learn pipelines and model tuning (GridSearchCV)",
          "SQL for data querying and joins",
          "Introduction to deep learning concepts"
        ],
        resources: [
          "Coursera — Andrew Ng's Machine Learning Specialization",
          "Kaggle — Intermediate Machine Learning micro-course",
          "Hands-On Machine Learning (book) by Aurélien Géron",
          "StatQuest YouTube channel — ML concepts explained visually",
          "Mode Analytics — SQL tutorial for data analysis"
        ],
        milestoneProject: "Build an end-to-end ML project: pick a Kaggle competition dataset, perform EDA, engineer features, train and compare at least 3 different models, tune hyperparameters, and submit your predictions to the Kaggle leaderboard."
      },
      Advanced: {
        assessmentQuestions: [
          "Have you built and trained deep learning models using TensorFlow or PyTorch?",
          "Can you design and deploy an ML model as an API or web service?",
          "Are you familiar with NLP techniques (tokenization, embeddings, transformers)?",
          "Have you worked with big data tools like Spark, or cloud ML platforms (AWS SageMaker, GCP Vertex AI)?"
        ],
        topics: [
          "Deep learning — CNNs, RNNs, Transformers, attention mechanisms",
          "Natural Language Processing — text preprocessing, word embeddings, BERT/GPT",
          "Computer vision — image classification, object detection",
          "MLOps — model deployment, monitoring, CI/CD for ML",
          "Big data tools — Apache Spark, Hadoop basics",
          "Cloud ML platforms — AWS SageMaker, Google Vertex AI, Azure ML",
          "Ethics and fairness in AI"
        ],
        resources: [
          "fast.ai — Practical Deep Learning for Coders (free course)",
          "Coursera — Deep Learning Specialization by Andrew Ng",
          "Hugging Face — NLP course and Transformers library docs",
          "Full Stack Deep Learning — MLOps and deployment course",
          "Papers With Code — stay updated on latest research and benchmarks"
        ],
        milestoneProject: "Build and deploy a deep learning application (e.g., image classifier, text summarizer, or chatbot) using PyTorch or TensorFlow. Deploy it as a web API with Flask/FastAPI and host it on a cloud platform."
      }
    }
  },

  "Python Programming": {
    stages: {
      Beginner: {
        assessmentQuestions: [
          "Can you write a Python function that takes parameters and returns a value?",
          "Do you understand Python data types (strings, lists, dictionaries, tuples)?",
          "Can you use control flow statements (if/elif/else, for loops, while loops)?",
          "Have you written and run a complete Python script (not just in a REPL)?"
        ],
        topics: [
          "Python syntax and data types — strings, numbers, booleans",
          "Data structures — lists, tuples, dictionaries, sets",
          "Control flow — conditionals, loops, comprehensions",
          "Functions — parameters, return values, scope, lambda functions",
          "File I/O — reading and writing text/CSV files",
          "Error handling — try/except, custom exceptions",
          "Modules and packages — import system, pip basics"
        ],
        resources: [
          "Python.org official tutorial (docs.python.org/3/tutorial)",
          "Automate the Boring Stuff with Python (free online book)",
          "freeCodeCamp — Scientific Computing with Python Certification",
          "Codecademy — Learn Python 3 course",
          "Real Python — beginner tutorials and guides"
        ],
        milestoneProject: "Build a command-line application (e.g., to-do list manager, quiz game, or expense tracker) in Python that reads/writes data to a file and uses functions, error handling, and at least one external library."
      },
      Intermediate: {
        assessmentQuestions: [
          "Can you write Python classes with inheritance, encapsulation, and methods?",
          "Have you used Python libraries like requests, Flask, or SQLAlchemy?",
          "Do you understand decorators, generators, and context managers?",
          "Can you write unit tests for your Python code using pytest or unittest?"
        ],
        topics: [
          "Object-oriented programming — classes, inheritance, polymorphism, magic methods",
          "Decorators, generators, and iterators",
          "Context managers and the 'with' statement",
          "Working with APIs using the requests library",
          "Database interactions — SQLite, SQLAlchemy ORM",
          "Web development basics with Flask or FastAPI",
          "Testing — pytest, mocking, test-driven development",
          "Virtual environments and dependency management"
        ],
        resources: [
          "Real Python — intermediate Python tutorials",
          "Fluent Python (book) by Luciano Ramalho",
          "Corey Schafer YouTube channel — Python OOP and advanced topics",
          "TestDriven.io — Flask and FastAPI tutorials",
          "Talk Python to Me — podcast and courses"
        ],
        milestoneProject: "Build a REST API using Flask or FastAPI with a database backend (SQLite or PostgreSQL). Include user authentication, CRUD operations, input validation, error handling, and write unit tests for all endpoints."
      },
      Advanced: {
        assessmentQuestions: [
          "Can you design and implement concurrent/parallel programs (asyncio, threading, multiprocessing)?",
          "Have you built and deployed a production Python application?",
          "Are you familiar with design patterns and software architecture in Python?",
          "Can you profile and optimize Python code for performance?"
        ],
        topics: [
          "Concurrency — asyncio, threading, multiprocessing, async/await",
          "Design patterns — singleton, factory, observer, strategy in Python",
          "Advanced OOP — metaclasses, descriptors, ABCs",
          "Performance profiling and optimization — cProfile, line_profiler, memory optimization",
          "Packaging and distributing Python projects (setuptools, PyPI)",
          "CI/CD pipelines for Python projects",
          "System design and microservices architecture",
          "Contributing to open source Python projects"
        ],
        resources: [
          "Architecture Patterns with Python (book) by Harry Percival & Bob Gregory",
          "Python Cookbook (book) by David Beazley",
          "RealPython — advanced async and concurrency tutorials",
          "Raymond Hettinger — PyCon talks (YouTube)",
          "GitHub — contributing to CPython and popular open source projects"
        ],
        milestoneProject: "Design and build a production-grade Python application (e.g., a distributed task queue, real-time data pipeline, or microservice) using advanced patterns. Include async I/O, comprehensive tests, Docker deployment, CI/CD, and documentation."
      }
    }
  }
};

/**
 * Get the roadmap data for a specific track and stage.
 * Returns null if the track or stage is not found.
 */
export function getRoadmap(trackName, stage) {
  const track = TRACKS[trackName];
  if (!track) return null;
  const stageData = track.stages[stage];
  if (!stageData) return null;
  return stageData;
}

/**
 * Get the list of available track names.
 */
export function getAvailableTracks() {
  return Object.keys(TRACKS);
}

/**
 * Check if a track name exists in the knowledge base.
 */
export function isKnownTrack(trackName) {
  return trackName in TRACKS;
}
