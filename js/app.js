const BACKEND_URL = '/api/chat';

let apiKey = localStorage.getItem('esaip_k') || '';
let role   = localStorage.getItem('esaip_r') || 'student';
let lang   = localStorage.getItem('esaip_l') || 'fr';
let history = [], busy = false;
let attachedFile = null;

// ══════════════════════════════
//  COURSE DATA (from esaip.org)
// ══════════════════════════════
const COURSE_DATA = `
=== ESAIP COMPLETE COURSE CATALOG (source: esaip.org) ===

── 1. INGÉNIEUR DU NUMÉRIQUE / DIGITAL ENGINEERING (Bac+5) ──
URL: https://www.esaip.org/formation/ingenieur-en-numerique/
Duration: 5 years | 2 prep cycle + 3 engineer cycle
Campus: Angers & Aix-en-Provence
Diploma: Ingénieur diplômé ESAIP spécialité Informatique et Réseaux — CTI accredited, EUR-ACE, RNCP 35568
Fees: Prep (Y1-2): 6,300€/yr | Engineer (Y3-5): 8,800€/yr | Anglophone Aix track: 6,800€/yr | Campus fee: 200€/yr | Alumni: 90€ at Y3
Key stats: 5 years | 12 months internship | 2 semesters abroad
Admissions:
  Y1: Bac général/techno via Parcoursup + Puissance Alpha post-bac
  Delayed entry March: Bac+1 in progress via Puissance Alpha Admissions Rebond
  Y2: 1st year validated (PASS/Licence/CPGE) via Admissions Rebond
  Y3: CPGE (MP/PC/PSI/PT) via Puissance Alpha CPGE | BUT/BTS/Licence via direct application on esaip.org
2 specialisation tracks (choose in Y4):
  [A] CYBERSÉCURITÉ: Ethical Hacking, system audit, vulnerability identification, countermeasures, user awareness
  [B] INTELLIGENCE ARTIFICIELLE: AI/ML systems, image recognition, speech/text processing, automation
Curriculum Y1-2 (Prep): Maths, Physics, Probability | English (LV1) + German/Spanish/Italian (LV2) | Algorithmics, C & Python, networks | Communication, RSE, finance
Curriculum Y3-4 (Engineer): Probability, Graph theory, Algorithmics | Cybersecurity, Quantum computing, Network security | AI, Web/mobile dev, Virtualization | Project management, IT law, RSE | LV1+LV2 continued
Internships: Y1: 1 month | Y3: 2 months | Y4: 3 months + 1 semester abroad | Y5: 6 months (alternance option)
Career outcomes: IoT Developer/Validator, Chief Data Officer, Data Analyst, Big Data Consultant, AI Engineer, CISO, Digital Forensics Analyst, Network Security Manager

── 2. INGÉNIEUR GESTION DES RISQUES & ENVIRONNEMENT / RISK & ENVIRONMENT ENGINEERING (Bac+5) ──
URL: https://www.esaip.org/formation/ingenieur-en-gestion-des-risques-environnement/
Duration: 5 years | Campus: Angers & Aix-en-Provence
Diploma: Ingénieur diplômé ESAIP spécialité Gestion des risques et Environnement — CTI, EUR-ACE, RNCP 35567
Fees: Prep: 6,300€/yr | Engineer: 8,600€/yr | Campus: 200€/yr
Admissions: Same routes as Digital Engineering (Parcoursup, Puissance Alpha, direct)
Curriculum Y1-2: Maths, Physics | English + 2nd language | Chemistry, ecology, sustainable development | Communication, RSE
Curriculum Y3-4:
  GRE Sciences: Chemistry, Biology, Natural sciences, Statistics
  Risk management: Industrial/natural risk, Human factors, Professional risk analysis, Dangerous goods transport, Crisis management
  Environment: Ecological/energy transition, Natural risks, Environmental law, Energy performance, Climate change, Water management
  Management: Finance, HR, Law, Project management
Career outcomes: QHSE Coordinator, HSE Manager, Industrial Risk Engineer, Risk Manager, Energy Engineer, Energy Consultant, Environmental Engineer, CSR Manager, Crisis Manager, Ecology Specialist

── 3. BACHELOR CYBERSÉCURITÉ / CYBERSECURITY BACHELOR (Bac+3) ──
URL: https://www.esaip.org/formation/bachelor-cybersecurite/
Duration: 3 years | Campus: Angers only
Diploma: Responsable en Ingénierie informatique et Cybersécurité — Grade de Licence, RNCP 36972
Fees: 6,200€/yr | Alternance (Y2/Y3): covered by OPCO | Campus: 200€/yr
Key stats: 6 months internship | 5 months abroad | Alternance possible Y3
Admissions:
  Y1: Bac (général/techno/pro) via Parcoursup + Puissance Alpha Bachelor
  Y2: Bac+1 via Puissance Alpha Admissions Rebond
  Y3: BTS/BUT/Licence/Prépa — direct application on esaip.org + motivation interview
Curriculum Y1-2: Sciences (matrices, IoT electronics) | Python, C++, HTML/CSS | Architecture, OS, routing/switching | Cybersecurity fundamentals, ethical hacking, virtualization | Project management, IT law | English + international culture
Curriculum Y3: Language theory, graph theory | IoT development | Pentesting, advanced networks (CCNA3), web security | Agile project management, entrepreneurship | Intercultural management | Applied project
Career outcomes: IoT/Mobile Developer, IoT Designer, Pentester, SOC Analyst, Security Integrator, Data/network security manager, Secure software developer, IoT Architect, SOC Integrator

── 4. BACHELOR DÉVELOPPEMENT IA & DATA SCIENCES / AI & DATA SCIENCES BACHELOR (Bac+3) ──
URL: https://www.esaip.org/formation/bachelor-developpement-ia-data-sciences/
Duration: 3 years | Campus: Angers (ESAIP + UCO collaboration)
Key: Alternance possible Y3 | Y1-Y2 courses split between ESAIP and UCO
Admissions: Bac via Parcoursup + Puissance Alpha | Y3: BTS/BUT/Licence direct application
Curriculum Y1 (ESAIP+UCO): Python algorithms, OS, Digital culture, Web (HTML/CSS), Data visualisation
Curriculum Y2 (ESAIP+UCO): AI principles, Machine Learning, Dev project, Time series, Responsible digital, RSE
Y3 specialisation — choose:
  [ESAIP] IA track: DB architecture, AI development, Big Data, VR/3D design
  [UCO] Data Sciences: Data management, Data mining, Data analysis (finance/marketing), Business Intelligence
Career outcomes ESAIP track: DB Architect, AI Developer, Big Data Developer, Data Integrator, VR Designer, 3D Artist
Career outcomes UCO track: Data Manager, Data Mining Technician, Data Analyst (finance/marketing), BI Technician

── 5. INGÉNIEUR DU NUMÉRIQUE PAR APPRENTISSAGE (Bac+5) ──
URL: https://www.esaip.org/formation/ingenieur-en-numerique-par-apprentissage/
Campus: Angers | Mode: Alternance (apprentissage) only
Topics: Big Data, Cybersécurité, IA, IoT, Transition Numérique

── 6. INGÉNIEUR GRE PAR APPRENTISSAGE (Bac+5) ──
URL: https://www.esaip.org/formation/ingenieur-gestion-des-risques-environnement-par-apprentissage/
Campus: Angers | Mode: Alternance only
Topics: Énergie, Environnement, Gestion des risques, QHSE

── 7. EXPERT RÉSEAUX, INFRASTRUCTURES ET SÉCURITÉ (Bac+5) ──
URL: https://www.esaip.org/formation/formation-expert-reseaux-infrastructures-et-securite/
Campus: Angers & Aix | Mode: Alternance only | Topic: Cybersécurité

── 8. EXPERT EN ARCHITECTURE ET DÉVELOPPEMENT LOGICIEL (Bac+5) ──
URL: https://www.esaip.org/formation/formation-architecture-developpement-logiciel/
Campus: Angers & Aix | Mode: Alternance only | Topics: Big Data, IA

── 9. MSc CYBERSECURITY AND DATA SCIENCE (Bac+5) ──
URL: https://www.esaip.org/formation/msc-cybersecurity-and-data-science-2/
Campus: Angers | Language: English | Mode: Initial
Topics: Cybersecurity, AI/Data Science | International students welcome

── 10. FORMATION NUMÉRIQUE OPTION CYBERSÉCURITÉ (Bac+3) ──
URL: https://www.esaip.org/formation/formation-numerique-option-cybersecurite/
Campus: Aix-en-Provence only | Mode: Alternance + Initial | Topic: Cybersécurité

── 11. CYCLE PRÉPARATOIRE INTÉGRÉ ──
URL: https://www.esaip.org/formation/cycle-preparatoire-integre/
Campus: Angers & Aix | 2-year common prep for all 5-year programs
Includes anglophone track at Aix: 6,800€/yr

── 12. FORMATION TOUT AU LONG DE LA VIE (Continuing Education) ──
URL: https://www.esaip.org/formation/formation-tout-au-long-de-la-vie/
Campus: Angers | All topics | For working professionals

=== ESAIP GENERAL FACTS ===
Official name: ESAIP LaSalle (École Supérieure Angevine d'Informatique et de Productique)
Founded: 1988 | Group: ECAM LaSalle | Status: EESPIG (Établissement d'Enseignement Supérieur Privé d'Intérêt Général)
Lasallien values: accessibility, personalized support, social diversity
Students: ~1,100 | Campuses: 2 | Alumni: 6,500+
Accreditations: CTI (Commission des Titres d'Ingénieurs), EUR-ACE
Key performance: +90% CDI recruitment at graduation | <3 weeks average job search time | 2024-2025 data
International: 100% students do minimum 2 semesters abroad | 100+ university partners worldwide | Anglophone track at Aix from Y1
Cybersecurity Innovation Hub: 3 dedicated rooms at Angers (surveillance room, attack room, defense room) — real conditions training
Career Center: Professional guidance & workshops from Y1
Alumni network: 6,500+ since 1988 | LinkedIn group | Annual gala | Job board (internships, alternance, jobs)
MOODLE: https://moodle.esaip.org (NEW address — moved from static.esaip.org/moodle.html)
Apply: https://www.esaip.org/candidature/
All programs: https://www.esaip.org/formation/
Documentation: https://www.esaip.org/demande-de-documentation/
Contact admission: admission@esaip.org
Contact scolarité Angers: scolarite.angers@esaip.org | Tel: +33(0)2 41 96 65 65
Contact scolarité Aix: scolarite.aix@esaip.org

=== ESAIP MOODLE PLATFORM ===
URL: https://moodle.esaip.org (moved from static.esaip.org/moodle.html in 2024)
Login: SSO via ESAIP identifiers (same as ENT)
Purpose: Official e-learning platform — all courses, assignments, grades, materials

== HOW MOODLE WORKS AT ESAIP ==
Once logged in, the homepage shows:
- "Mes cours" (My courses) — list of all courses you're enrolled in for the current semester
- "Tableau de bord" (Dashboard) — upcoming deadlines, recent activity, calendar
- "Calendrier" — assignment due dates, exam schedules, events
- "Messages" — direct messages from teachers and classmates

Each COURSE PAGE typically contains:
1. **Annonces** (Announcements) — important info from the teacher
2. **Plan de cours / Syllabus** — course objectives, schedule, evaluation criteria
3. **Sections par semaine ou par thème** — course materials organized by week or topic
4. **Ressources** — PDFs, slides (PPTX), videos, external links
5. **Devoirs** (Assignments) — submissions with deadlines
6. **Quiz / QCM** — graded online tests
7. **Forum** — class discussions
8. **Notes / Carnet de notes** (Gradebook) — your grades for all assignments

== COMMON MOODLE TASKS ==
For STUDENTS:
- Submit an assignment: Course → Devoir → Add submission → Upload file → Save → Submit
- Check grades: Course → Notes (left menu) OR Profile → Grades
- Watch a recorded class: Course → Section → click video resource
- Take a quiz: Course → Quiz → Attempt quiz → Submit all and finish
- Download all course materials: Course → click each resource OR use "Tout télécharger" if available
- Join a forum: Course → Forum → Add new discussion topic / Reply
- See deadlines: Tableau de bord → Calendrier OR Cours → Calendrier intégré

For FACULTY:
- Create a course: Admin needs to provision; teachers add content
- Add a resource: Course → Activer le mode édition → Ajouter une activité ou ressource → Fichier/URL/Dossier
- Create an assignment: Activer le mode édition → Ajouter → Devoir → Set name, instructions, due date, grade
- Grade submissions: Course → Devoir → Voir tous les travaux remis → Note
- Create a quiz: Ajouter → Test → Configure → Add questions from question bank
- Send an announcement: Course → Annonces forum → Add discussion topic
- Export gradebook: Course → Notes → Export → CSV/Excel
- Track student activity: Course → Rapports → Logs

== MOODLE TROUBLESHOOTING ==
- "I can't see my course": Course not yet provisioned for the term — contact scolarité.angers@esaip.org or your pilote de formation
- "I forgot my password": Use "Mot de passe oublié" link on login page; if that fails, contact IT support at ESAIP
- "My submission won't upload": Check file size limit (typically 100 MB), file format accepted, and your internet connection
- "Quiz timed out": Contact the teacher immediately — they can sometimes re-open attempts
- "Can't access from off-campus": Should work from anywhere; if not, check if VPN is required (rare) or contact IT
- "Wrong grade displayed": Contact the teacher directly via Moodle messages or email

== MOODLE BEST PRACTICES ==
For students:
- Check Moodle DAILY during the semester
- Enable email notifications: Profile → Preferences → Notification preferences
- Use the mobile app (Moodle Mobile) for on-the-go access
- Download lecture PDFs the same day they're posted (in case files are removed later)
- Set calendar reminders 48h before each deadline

For teachers:
- Structure each course week-by-week or by theme for clarity
- Always provide a syllabus PDF on the front page
- Use Moodle Announcements (not just email) for class-wide messages
- Set assignment deadlines with a buffer (e.g. 23:59 not 17:00) for student flexibility
- Use the gradebook from week 1, not at the end of the semester

If a student or teacher asks about a SPECIFIC Moodle issue, problem, or feature you don't know about, direct them to:
- IT Support at ESAIP (via the helpdesk on the ENT)
- Their pilote de formation (program coordinator)
- The Moodle login page itself: https://moodle.esaip.org

=== CAMPUS LIFE & STUDENT SUPPORT ===

ANGERS CAMPUS (Main campus):
- Location: 18 Rue du 8 Mai 1945, 49180 Saint-Barthélemy-d'Anjou (near Angers)
- Facilities: Modern buildings, IT labs, Cybersecurity Innovation Hub, library, cafeteria, student lounge
- Cybersecurity Innovation Hub: 3 rooms — surveillance room (SOC), attack room (red team), defense room (blue team) for real-world training
- Student housing: Résidence étudiante on-site and nearby; CROUS options available
- Transport: Tramway Line A (Angers), bus routes, bike paths; ~15min from Angers city center
- City of Angers: Ranked #1 greenest city in France multiple years; ~160,000 inhabitants; vibrant student life with 40,000+ students citywide

AIX-EN-PROVENCE CAMPUS:
- Location: Part of the ECAM LaSalle network
- Offers: Cycle préparatoire intégré, Ingénieur du Numérique (anglophone track available from Y1)
- Anglophone track: All courses in English from Y1; ideal for international students; 6,800€/yr
- City of Aix: Sunny Provence; rich cultural heritage; close to Marseille

STUDENT ASSOCIATIONS & CLUBS:
- BDE (Bureau des Étudiants): Main student union organizing events, parties, integration weekends
- BDS (Bureau des Sports): Sports activities — football, basketball, badminton, climbing, etc.
- Clubs: Robotics, Gaming/Esports, Music, Photography, Humanitarian, Entrepreneurship
- Junior Enterprise: Student consulting firm for real IT/engineering projects
- Integration week: "Semaine d'intégration" at start of each year for new students
- Gala annuel: Formal annual celebration

ACADEMIC SUPPORT:
- Tutorat: Peer tutoring by senior students for difficult subjects
- Pilote de formation: Dedicated program coordinator for each program — first point of contact for academic issues
- Career center: CV workshops, mock interviews, job fairs, LinkedIn coaching from Y1
- International office: Help with exchange semesters, visa, accommodation abroad
- Psychological support: Counseling available through student services
- Disability support: Accommodations for students with disabilities (extra exam time, adapted materials)

FINANCIAL AID & SCHOLARSHIPS:
- Bourses CROUS: Based on social criteria (apply via messervices.etudiant.gouv.fr)
- Bourses au mérite: Merit-based scholarships for excellent students
- Alternance/Apprentissage: Tuition covered by employer's OPCO; student receives salary (~800-1400€/month)
- Payment plans: Tuition can be paid in installments (3-10 monthly payments)
- Student loans: BNP, Société Générale, and other banks offer preferential student loan rates with ESAIP partnership
- CVEC: Contribution Vie Étudiante (€103/year) mandatory for all students

INTERNATIONAL MOBILITY:
- 100% of engineering students spend at least 2 semesters abroad
- 100+ partner universities worldwide (USA, Canada, UK, Australia, Japan, Korea, etc.)
- Erasmus+ program available for European exchanges
- International internships: Companies worldwide; ESAIP's network helps place students
- Anglophone track at Aix: Full English curriculum from Y1
- Double diplomas possible with select partner universities

CTI COMPETENCY FRAMEWORK (for faculty):
CS1 — Sciences & Engineering Fundamentals: Mathematics, physics, computer science foundations
CS2 — Problem Solving & Analysis: Analytical thinking, modeling, scientific method
CS3 — Design & Implementation: System design, project execution, technical solutions
CS4 — Business & Economic Context: Entrepreneurship, management, finance, legal frameworks
CS5 — International & Intercultural: Languages, cross-cultural collaboration, global perspective
CS6 — Responsible Engineer: Ethics, sustainability, social responsibility, environmental awareness

Each competency is evaluated across programs using:
- Written exams and tests
- Project-based assessments
- Oral presentations and defenses
- Internship evaluations by supervisors
- Self-assessment portfolios
- Peer evaluation in group projects

ACADEMIC SUBJECTS EXPLAINED (for student help):
- Cybersecurity: Protecting systems, networks, and data from threats. Includes ethical hacking (testing for vulnerabilities), SOC operations (monitoring), incident response, cryptography, and security auditing.
- Artificial Intelligence: Teaching machines to learn from data. Includes machine learning (supervised/unsupervised), deep learning (neural networks), NLP (text processing), computer vision (image recognition), and reinforcement learning.
- Networks: How computers communicate. Includes TCP/IP, routing/switching (Cisco CCNA), wireless networks, VPNs, firewalls, and network architecture.
- Python: Versatile programming language used in AI, data science, automation, and web development. Key libraries: NumPy, Pandas, Scikit-learn, TensorFlow, Flask.
- Data Science: Extracting insights from data. Includes statistics, data visualization, SQL databases, machine learning, and business intelligence tools.
- QHSE: Quality, Health, Safety, Environment management. Standards include ISO 9001 (quality), ISO 14001 (environment), ISO 45001 (safety).
- Risk Management: Identifying, assessing, and mitigating risks in industrial, environmental, and organizational contexts.
`;

// ══════════════════════════════
//  TRANSLATIONS
// ══════════════════════════════
const T = {
  fr: {
    su_sub:'École d\'Ingénieurs · Angers · Aix-en-Provence',
    su_profile_lbl:'Choisissez votre profil',
    rc_sn:'Étudiant(e)',rc_ss:'Cours, formations, campus',rc_fn:'Enseignant(e)',rc_fs:'Moodle, syllabus, notes',
    su_key_lbl:'Mot de passe ESAIP',su_btn:'Accéder à l\'assistant →',
    su_note:'Demandez le mot de passe à votre enseignant',su_note2:'Aucune installation requise',
    mb_s:'🎓 Mode Étudiant',mb_f:'👩‍🏫 Mode Enseignant',
    tb_s:'Assistant IA ESAIP — Étudiants',tb_f:'Assistant IA ESAIP — Enseignants',
    tb_sub:'École d\'Ingénieurs · Angers · Aix-en-Provence',tb_status:'En ligne',
    ihint:'Appuyez sur Entrée pour envoyer · Assistant officiel ESAIP',
    lbl_prog:'Formations',lbl_info:'Informations',lbl_links:'Liens rapides',lbl_tools:'Outils pédagogiques',
    lbl_moodle_s:'Aide Moodle',lbl_moodle_f:'Moodle enseignants',
    m_submit:'Soumettre un devoir',m_grades:'Voir mes notes',m_quiz:'Passer un quiz',m_dl:'Télécharger les ressources',m_trouble:'Dépannage',m_upload:'Joindre un document',
    mf_res:'Ajouter une ressource',mf_dev:'Créer un devoir',mf_grade:'Noter les copies',mf_exp:'Exporter les notes',mf_upload:'Analyser un document',
    s_num:'Ingénieur du Numérique',s_gre:'Ingénieur GRE',s_exp:'Programmes Expert Bac+5',s_alt:'Formations en alternance',
    s_adm:'Admission & candidature',s_fees:'Frais & financement',s_intl:'International',s_life:'Vie étudiante',
    s_apply:'Candidature',s_allf:'Toutes les formations',s_doc:'Documentation',
    f_moodle:'Créer un cours Moodle',f_syl:'Rédiger un syllabus CTI',f_plan:'Plan de cours',f_eval:'Grille d\'évaluation',f_qcm:'Créer un QCM / Examen',f_rep:'Rapport de jury',f_email:'Email aux étudiants',
    f_switch:'Changer de profil',f_key:'Se déconnecter',f_new:'✨ Nouveau chat',
    sndr_b:'Assistant ESAIP',sndr_u:'Vous',
    chips_s:['Comment s\'inscrire à l\'ESAIP ?','Comparer toutes les formations','Frais de scolarité par programme','Alternance et apprentissage','Opportunités internationales'],
    chips_f:['Créer un cours Moodle','Rédiger un syllabus','Générer un QCM','Plan de cours pédagogique','Email pour les étudiants'],
    welcome_s:`Bonjour ! Je suis l'assistant IA officiel de l'**ESAIP**.\n\nJe peux vous aider sur :\n• 📚 Toutes les **formations** ESAIP (cursus, frais, admissions)\n• 🖥️ **Moodle** — soumettre un devoir, voir vos notes, dépannage\n• 📎 **Analyser un document** Moodle (PDF, image, texte) que vous me joignez\n\n☰ **Cliquez sur le bouton Menu en haut à gauche pour explorer les programmes et outils.**`,
    welcome_f:`Bonjour ! Je suis l'assistant IA de l'**ESAIP** pour les enseignants.\n\nJe peux vous aider à :\n• 📝 Créer **syllabus, plans de cours, QCM** et grilles d'évaluation CTI\n• 🖥️ Utiliser **Moodle** — ajouter ressources, créer devoirs, noter, exporter\n• 📎 **Analyser un document** Moodle que vous me joignez\n\n☰ **Cliquez sur le bouton Menu en haut à gauche pour accéder aux outils.**`,
    err_api:'❌ Erreur API : ',err_net:'❌ Erreur de connexion. Vérifiez votre connexion internet.',
    spl_sub:'Assistant IA · Angers · Aix-en-Provence',
    inp_ph:'Posez votre question…',
  },
  en: {
    su_sub:'School of Engineering · Angers · Aix-en-Provence',
    su_profile_lbl:'Choose your profile',
    rc_sn:'Student',rc_ss:'Courses, programs, campus',rc_fn:'Faculty',rc_fs:'Moodle, syllabus, grades',
    su_key_lbl:'ESAIP password',su_btn:'Access the assistant →',
    su_note:'Ask your teacher for the password',su_note2:'No installation required',
    mb_s:'🎓 Student Mode',mb_f:'👩‍🏫 Faculty Mode',
    tb_s:'ESAIP AI Assistant — Students',tb_f:'ESAIP AI Assistant — Faculty',
    tb_sub:'School of Engineering · Angers · Aix-en-Provence',tb_status:'Online',
    ihint:'Press Enter to send · Official ESAIP AI assistant',
    lbl_prog:'Programs',lbl_info:'Information',lbl_links:'Quick links',lbl_tools:'Teaching tools',
    lbl_moodle_s:'Moodle help',lbl_moodle_f:'Moodle for faculty',
    m_submit:'Submit assignment',m_grades:'View my grades',m_quiz:'Take a quiz',m_dl:'Download materials',m_trouble:'Troubleshooting',m_upload:'Attach document',
    mf_res:'Add a resource',mf_dev:'Create assignment',mf_grade:'Grade submissions',mf_exp:'Export gradebook',mf_upload:'Analyze document',
    s_num:'Digital Engineering',s_gre:'Risk & Environment Eng.',s_exp:'Expert Programs Bac+5',s_alt:'Apprenticeship programs',
    s_adm:'Admission & application',s_fees:'Tuition & funding',s_intl:'International',s_life:'Student life',
    s_apply:'Apply now',s_allf:'All programs',s_doc:'Documentation',
    f_moodle:'Create a Moodle course',f_syl:'Write a CTI syllabus',f_plan:'Lesson plan',f_eval:'Grading rubric',f_qcm:'Create quiz / exam',f_rep:'Jury report',f_email:'Email to students',
    f_switch:'Switch profile',f_key:'Sign out',f_new:'✨ New Chat',
    sndr_b:'ESAIP Assistant',sndr_u:'You',
    chips_s:['How to apply to ESAIP?','Compare all programs','Tuition fees by program','Apprenticeship options','International opportunities'],
    chips_f:['Create a Moodle course','Write a syllabus','Generate a quiz','Lesson plan template','Email to students'],
    welcome_s:`Hello! I'm the official **ESAIP** AI assistant.\n\nI can help you with:\n• 📚 All ESAIP **programs** (curriculum, fees, admissions)\n• 🖥️ **Moodle** — submit assignments, view grades, troubleshoot\n• 📎 **Analyze a document** you attach (PDF, image, text)\n\n☰ **Click the Menu button (top left) to explore programs and tools.**`,
    welcome_f:`Hello! I'm the **ESAIP** AI assistant for faculty.\n\nI can help you:\n• 📝 Create **syllabi, lesson plans, quizzes** and CTI grading rubrics\n• 🖥️ Use **Moodle** — add resources, create assignments, grade, export\n• 📎 **Analyze a document** you attach\n\n☰ **Click the Menu button (top left) to access teaching tools.**`,
    err_api:'❌ API Error: ',err_net:'❌ Connection error. Please check your internet connection.',
    spl_sub:'AI Assistant · Angers · Aix-en-Provence',
    inp_ph:'Ask a question…',
  }
};

function t(k)  { return T[lang][k] || k; }
function _t(fr, en) { return lang === 'fr' ? fr : en; }
function $e(id) { return document.getElementById(id); }

// ══════════════════════════════
//  SYSTEM PROMPTS
// ══════════════════════════════
function buildSysPrompt() {
  const isEN = lang === 'en';
  if (role === 'student') {
    return (isEN
      ? `You are the ESAIP AI Assistant. NEVER say "I'm Claude" or mention Anthropic.

You are an expert educational assistant for ESAIP engineering school students. Respond in the same language the student writes (auto-detect French/English).

Your personality: intelligent, warm, thorough, and genuinely helpful — like the best teacher they've ever had. You explain things clearly with real depth, not surface-level answers.

When a student asks about a topic:
- Give a THOROUGH explanation with real substance
- Break down complex concepts step by step
- Use analogies and examples to make things click
- If they ask about a course subject (cybersecurity, AI, networks, Python, etc.), explain it deeply with practical examples
- If they ask about ESAIP programs, give complete details: curriculum, fees, admissions, career paths, campus info
- If they ask to summarize something, give a clear, structured summary
- If they ask to compare programs, do a detailed side-by-side comparison

You know everything about ESAIP: all 12 programs, both campuses (Angers & Aix), student life, clubs, financial aid, international mobility, Moodle platform, and academic subjects taught.

Always be helpful. Never give one-line answers. Explain like you care about the student understanding.`
      : `Tu es l'Assistant IA ESAIP. Ne dis JAMAIS "Je suis Claude" ou mentionne Anthropic.

Tu es un assistant éducatif expert pour les étudiants de l'école d'ingénieurs ESAIP. Réponds dans la langue de l'étudiant (auto-détection français/anglais).

Ta personnalité : intelligent, chaleureux, approfondi et vraiment utile — comme le meilleur prof qu'ils aient eu. Tu expliques les choses clairement avec de la vraie profondeur, pas des réponses superficielles.

Quand un étudiant pose une question :
- Donne une explication APPROFONDIE avec de la vraie substance
- Décompose les concepts complexes étape par étape
- Utilise des analogies et exemples pour faire comprendre
- S'il demande sur un sujet de cours (cybersécurité, IA, réseaux, Python, etc.), explique en profondeur avec des exemples pratiques
- S'il demande sur les programmes ESAIP, donne les détails complets : cursus, frais, admissions, débouchés, campus
- S'il demande un résumé, donne un résumé clair et structuré
- S'il demande de comparer des programmes, fais une comparaison détaillée côte à côte

Tu connais tout sur l'ESAIP : les 12 programmes, les deux campus (Angers & Aix), la vie étudiante, les clubs, les aides financières, la mobilité internationale, Moodle, et les matières académiques.

Sois toujours utile. Ne donne jamais de réponses d'une ligne. Explique comme si tu te souciais que l'étudiant comprenne.`)
    + '\n\n' + COURSE_DATA;
  } else {
    return (isEN
      ? `You are the ESAIP AI Assistant for faculty. NEVER say "I'm Claude" or mention Anthropic.

You are an expert assistant for ESAIP teachers and academic staff. Respond in the teacher's language (auto-detect French/English).

Your personality: professional, thorough, and genuinely useful — like a brilliant teaching assistant. You create complete, ready-to-use documents, not generic templates.

When a teacher asks for help:
- Create COMPLETE, professional documents (syllabi, lesson plans, rubrics, quizzes, reports)
- Apply CTI competency framework (CS1-CS6) naturally in evaluations and syllabi
- Give detailed Moodle instructions with step-by-step guidance
- For rubrics, include specific criteria, point scales, and performance descriptors
- For quizzes, generate real questions with correct answers and explanations
- For emails, write polished, professional communications
- For lesson plans, include timing, activities, learning objectives, and assessment

You know everything about ESAIP: CTI framework, all programs, Moodle platform, academic calendar, evaluation methods, and pedagogical best practices.

Always deliver substantial, usable output. Never give skeleton answers.`
      : `Tu es l'Assistant IA ESAIP pour les enseignants. Ne dis JAMAIS "Je suis Claude" ou mentionne Anthropic.

Tu es un assistant expert pour les enseignants et le personnel académique de l'ESAIP. Réponds dans la langue de l'enseignant (auto-détection français/anglais).

Ta personnalité : professionnel, approfondi et vraiment utile — comme un brillant assistant pédagogique. Tu créés des documents complets et directement utilisables, pas des templates génériques.

Quand un enseignant demande de l'aide :
- Crée des documents COMPLETS et professionnels (syllabus, plans de cours, grilles, QCM, rapports)
- Applique le référentiel CTI (CS1-CS6) naturellement dans les évaluations et syllabus
- Donne des instructions Moodle détaillées étape par étape
- Pour les grilles, inclus critères spécifiques, barèmes et descripteurs de performance
- Pour les QCM, génère de vraies questions avec réponses correctes et explications
- Pour les emails, rédige des communications polies et professionnelles
- Pour les plans de cours, inclus timing, activités, objectifs et évaluation

Tu connais tout sur l'ESAIP : référentiel CTI, tous les programmes, Moodle, calendrier académique, méthodes d'évaluation et bonnes pratiques pédagogiques.

Livre toujours un contenu substantiel et utilisable. Ne donne jamais de réponses squelettiques.`)
    + '\n\n' + COURSE_DATA;
  }
}

// ══════════════════════════════
//  STARTUP
// ══════════════════════════════
window.onload = () => {
  setTimeout(() => {
    $e('splash').classList.add('out');
    setTimeout(() => {
      $e('splash').style.display = 'none';
      if (!apiKey) $e('setup').classList.remove('hidden');
      else initApp();
    }, 600);
  }, 2200);

  setLang(lang, true);
  setRole(role, true);
  $e('txt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) send(); });
};

function setLang(l, silent) {
  lang = l;
  document.documentElement.lang = l;
  if (!silent) localStorage.setItem('esaip_l', l);
  $e('lt-fr').classList.toggle('on', l === 'fr');
  $e('lt-en').classList.toggle('on', l === 'en');
  $e('lsw-fr').classList.toggle('on', l === 'fr');
  $e('lsw-en').classList.toggle('on', l === 'en');
  applyi18n();
}

function setRole(r, silent) {
  role = r;
  if (!silent) localStorage.setItem('esaip_r', r);
  $e('rc-s').classList.toggle('on', r === 'student');
  $e('rc-f').classList.toggle('on', r === 'faculty');
}

function switchLang(l) { setLang(l); if (history.length) updateUI(); }

function applyi18n() {
  const map = {
    su_sub:'su-sub', su_profile_lbl:'su-profile-lbl',
    rc_sn:'rc-sn', rc_ss:'rc-ss', rc_fn:'rc-fn', rc_fs:'rc-fs',
    su_key_lbl:'su-key-lbl', su_btn:'su-btn', su_note:'su-note', su_note2:'su-note2',
    s_num:'s-num', s_gre:'s-gre', s_exp:'s-exp', s_alt:'s-alt',
    s_adm:'s-adm', s_fees:'s-fees', s_intl:'s-intl', s_life:'s-life',
    s_apply:'s-apply', s_allf:'s-allf', s_doc:'s-doc',
    f_moodle:'f-moodle', f_syl:'f-syl', f_plan:'f-plan', f_eval:'f-eval',
    f_qcm:'f-qcm', f_rep:'f-rep', f_email:'f-email',
    f_switch:'f-switch', f_key:'f-key', f_new:'f-new',
    lbl_prog:'lbl-prog', lbl_info:'lbl-info', lbl_links:'lbl-links', lbl_tools:'lbl-tools',
    lbl_moodle_s:'lbl-moodle-s', lbl_moodle_f:'lbl-moodle-f',
    m_submit:'m-submit', m_grades:'m-grades', m_quiz:'m-quiz', m_dl:'m-dl',
    m_trouble:'m-trouble', m_upload:'m-upload',
    mf_res:'mf-res', mf_dev:'mf-dev', mf_grade:'mf-grade', mf_exp:'mf-exp', mf_upload:'mf-upload',
  };
  Object.entries(map).forEach(([k, id]) => { const el = $e(id); if (el) el.textContent = t(k); });
  const txt = $e('txt'); if (txt) txt.placeholder = t('inp_ph');
  const hint = $e('ihint'); if (hint) hint.textContent = t('ihint');
  const tbs = $e('tb-status'); if (tbs) tbs.textContent = t('tb_status');
}

function initApp() {
  role = localStorage.getItem('esaip_r') || role;
  lang = localStorage.getItem('esaip_l') || lang;
  history = [];
  $e('msgs').innerHTML = '';
  $e('sec-stu').style.display = role === 'student' ? 'block' : 'none';
  $e('sec-fac').style.display = role === 'faculty' ? 'block' : 'none';
  $e('mode-pill-wrap').innerHTML = `<div class="mode-badge ${role === 'student' ? 'mb-s' : 'mb-f'}">${t(role === 'student' ? 'mb_s' : 'mb_f')}</div>`;
  updateUI();
  addBot(t(role === 'student' ? 'welcome_s' : 'welcome_f'));
}

function updateUI() {
  $e('tb-title').textContent = t(role === 'student' ? 'tb_s' : 'tb_f');
  $e('tb-sub').textContent = t('tb_sub');
  applyi18n();
  renderChips();
}

function renderChips() {
  const cc = t(role === 'student' ? 'chips_s' : 'chips_f');
  $e('chips').innerHTML = cc.map(c => `<span class="chip" onclick="q('${c.replace(/'/g, "\\'")}')">${c}</span>`).join('');
}

function startApp() {
  const k = $e('api-in').value.trim();
  if (!k) { alert(_t('Veuillez entrer le mot de passe.', 'Please enter the password.')); return; }
  apiKey = k;
  localStorage.setItem('esaip_k', apiKey);
  localStorage.setItem('esaip_r', role);
  localStorage.setItem('esaip_l', lang);
  $e('setup').classList.add('hidden');
  initApp();
}

function switchProfile() { $e('setup').classList.remove('hidden'); $e('api-in').value = ''; }
function resetKey() { localStorage.removeItem('esaip_k'); apiKey = ''; $e('setup').classList.remove('hidden'); $e('api-in').value = ''; }
function newChat() {
  history = [];
  $e('msgs').innerHTML = '';
  $e('chips').innerHTML = '';
  clearFile();
  addBot(t(role === 'student' ? 'welcome_s' : 'welcome_f'));
  $e('txt').value = '';
  $e('txt').focus();
  renderChips();
  closeMenu();
}
function toggleMenu() {
  $e('sidebar').classList.toggle('open');
  $e('sidebar-overlay').classList.toggle('open');
}
function closeMenu() {
  $e('sidebar').classList.remove('open');
  $e('sidebar-overlay').classList.remove('open');
}
function q(txt) { closeMenu(); $e('txt').value = txt; send(); }

// ══════════════════════════════
//  RENDER
// ══════════════════════════════
function fmt(s) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^#{1,3}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^\|(.+)\|$/gm, row => {
      const cells = row.split('|').filter(c => c.trim() && !/^[-:]+$/.test(c.trim()));
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>)+/gs, m => `<table>${m}</table>`)
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`)
    .replace(/<\/(li|ul|h4|tr|table)>\n/g, '</$1>')
    .replace(/\n<(li|ul|h4|tr|table)/g, '<$1')
    .replace(/\n{2,}/g, '\n')
    .replace(/\n/g, '<br>');
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function addBot(txt) {
  const msgs = $e('msgs');
  const row = document.createElement('div');
  row.className = 'mrow';
  row.innerHTML = `<div class="av av-b"><img src="https://www.esaip.org/wp-content/themes/esaip-v2/assets/images/Logo-ESAIP_2024.svg" alt="ES"/></div><div class="mc"><span class="sndr">${t('sndr_b')}</span><div class="bbl bb">${fmt(txt)}</div></div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

function addUser(txt) {
  const msgs = $e('msgs');
  const row = document.createElement('div');
  row.className = 'mrow u';
  const avc = role === 'faculty' ? 'av-f' : 'av-s';
  row.innerHTML = `<div class="av ${avc}">Me</div><div class="mc"><span class="sndr">${t('sndr_u')}</span><div class="bbl bu">${esc(txt)}</div></div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  const msgs = $e('msgs');
  const row = document.createElement('div');
  row.className = 'mrow'; row.id = 'typ';
  row.innerHTML = `<div class="av av-b"><img src="https://www.esaip.org/wp-content/themes/esaip-v2/assets/images/Logo-ESAIP_2024.svg" alt="ES"/></div><div class="mc"><span class="sndr">${t('sndr_b')}</span><div class="bbl bb btyp"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

function rmTyping() { const e = $e('typ'); if (e) e.remove(); }

// ══════════════════════════════
//  API CALL
// ══════════════════════════════
async function send() {
  if (busy) return;
  const inp = $e('txt');
  const text = inp.value.trim();
  if (!text && !attachedFile) return;

  let userMsg, displayText;

  if (attachedFile) {
    const att = attachedFile;
    const askText = text || _t(
      'Analyse ce document Moodle et explique-moi son contenu en détail.',
      'Analyze this Moodle document and explain its content in detail.'
    );

    if (att.type === 'image') {
      userMsg = {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: att.mimeType, data: att.data } },
          { type: 'text', text: askText }
        ]
      };
    } else if (att.type === 'pdf') {
      userMsg = {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: att.data } },
          { type: 'text', text: askText }
        ]
      };
    } else {
      userMsg = {
        role: 'user',
        content: `[${_t('Document joint', 'Attached document')}: ${att.name}]\n\n--- ${_t('CONTENU', 'CONTENT')} ---\n${att.data}\n--- ${_t('FIN', 'END')} ---\n\n${askText}`
      };
    }
    displayText = `📎 ${att.name}${text ? '\n\n' + text : ''}`;
  } else {
    userMsg = { role: 'user', content: text };
    displayText = text;
  }

  inp.value = '';
  $e('chips').innerHTML = '';
  addUser(displayText);
  history.push(userMsg);
  clearFile();

  busy = true;
  $e('snd').disabled = true;
  addTyping();

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-school-password': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        system: buildSysPrompt(),
        messages: history,
      }),
    });
    const data = await res.json();
    rmTyping();
    if (data.error) {
      addBot(t('err_api') + data.error.message);
    } else {
      const reply = (data.content || []).map(c => c.text || '').join('');
      history.push({ role: 'assistant', content: reply });
      addBot(reply);
    }
  } catch (e) {
    rmTyping();
    addBot(t('err_net'));
  }

  busy = false;
  $e('snd').disabled = false;
  $e('txt').focus();
  $e('msgs').scrollTop = $e('msgs').scrollHeight;
}

// ══════════════════════════════
//  FILE UPLOAD
// ══════════════════════════════
async function onFileSelected(ev) {
  const file = ev.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert(_t('Fichier trop volumineux (max 5 MB).', 'File too large (max 5 MB).'));
    ev.target.value = '';
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
  const isPdf   = ext === 'pdf';
  const isText  = ['txt', 'md', 'html', 'docx'].includes(ext);

  try {
    if (isImage) {
      attachedFile = {
        name: file.name, type: 'image',
        mimeType: file.type || 'image/png',
        size: file.size, data: await fileToBase64(file),
      };
    } else if (isPdf) {
      attachedFile = {
        name: file.name, type: 'pdf',
        mimeType: 'application/pdf',
        size: file.size, data: await fileToBase64(file),
      };
    } else if (isText) {
      const text = await file.text();
      attachedFile = {
        name: file.name, type: 'text',
        size: file.size, data: text.slice(0, 50000),
      };
    } else {
      alert(_t('Format non supporté. Formats acceptés : PDF, TXT, MD, HTML, PNG, JPG.', 'Unsupported format. Accepted: PDF, TXT, MD, HTML, PNG, JPG.'));
      ev.target.value = '';
      return;
    }

    $e('fc-name').textContent = file.name;
    $e('file-chip').classList.add('show');
    $e('atch-btn').classList.add('has');
    if (!$e('txt').value) {
      $e('txt').placeholder = _t(`Posez votre question sur "${file.name}"…`, `Ask about "${file.name}"…`);
    }
    $e('txt').focus();
  } catch (err) {
    alert(_t('Erreur de lecture du fichier.', 'Could not read file.'));
    console.error(err);
  }

  ev.target.value = '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function clearFile() {
  attachedFile = null;
  $e('file-chip').classList.remove('show');
  $e('atch-btn').classList.remove('has');
  $e('txt').placeholder = t('inp_ph');
}
