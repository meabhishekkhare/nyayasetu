window.NYAYA_STATES = {
  "Madhya Pradesh": ["Jabalpur","Bhopal","Indore","Gwalior","Ujjain","Sagar","Rewa","Satna"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Kolhapur"],
  "Delhi": ["New Delhi","Central Delhi","South Delhi","North Delhi","Dwarka","Rohini"],
  "Uttar Pradesh": ["Lucknow","Noida","Ghaziabad","Kanpur","Varanasi","Prayagraj","Agra"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belagavi"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"],
  "West Bengal": ["Kolkata","Howrah","Siliguri","Durgapur","Asansol"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar"],
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Tirupati"],
  "Kerala": ["Kochi","Thiruvananthapuram","Kozhikode","Thrissur"],
  "Punjab": ["Chandigarh","Ludhiana","Amritsar","Jalandhar","Patiala"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Ambala","Karnal"],
  "Bihar": ["Patna","Gaya","Muzaffarpur","Bhagalpur"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Puri"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
  "Uttarakhand": ["Dehradun","Haridwar","Haldwani","Roorkee"],
  "Goa": ["Panaji","Margao","Vasco da Gama"]
};

window.NYAYA_CASE_TAXONOMY = {
  "Civil & Property": { sub: ["Property Title / Ownership","Landlord-Tenant / Eviction","Builder Delay / Unpaid Dues","Partition / Ancestral","Injunction / Stay"], law: "Transfer of Property Act, 1882 • Specific Relief Act, 1963 • CPC, 1908 • RERA, 2016", type: "Civil Suit / Title & Recovery" },
  "Criminal & Bail": { sub: ["Anticipatory / Regular Bail","FIR Quashing / Defence","Cheque Bounce (Sec 138)","Assault / Trespass","White Collar / Fraud"], law: "BNS, 2023 • BNSS, 2023 • Negotiable Instruments Act, 1881 (Sec 138)", type: "Criminal Trial / Bail Application" },
  "Family & Matrimonial": { sub: ["Mutual / Contested Divorce","Maintenance & Alimony","Child Custody","Domestic Violence","Succession / Will"], law: "Hindu Marriage Act, 1955 • Hindu Succession Act, 1956 • PWDVA, 2005", type: "Family Court Petition" },
  "Consumer & Banking": { sub: ["Defective Product / Service","Insurance Claim Rejection","Bank / Loan Dispute","Medical Negligence"], law: "Consumer Protection Act, 2019 • RBI Ombudsman Scheme • Insurance Act, 1938", type: "Consumer Commission Complaint" },
  "Corporate & Contract": { sub: ["Breach of Contract","MSME / Business Recovery","Shareholder Dispute","IP / Trademark"], law: "Indian Contract Act, 1872 • MSMED Act, 2006 • Companies Act, 2013", type: "Commercial Suit / Arbitration" },
  "Cyber & IT": { sub: ["Online / UPI Fraud","Identity Theft","Social Media Defamation","Data Breach"], law: "IT Act, 2000 (Sec 66C, 66D) • BNS, 2023 • DPDP Act, 2023", type: "Cyber Crime & Civil Damages" },
  "Labour & Employment": { sub: ["Wrongful Termination","Unpaid Salary / Gratuity","POSH Harassment","Service Matter"], law: "Industrial Disputes Act, 1947 • Payment of Gratuity Act, 1972 • POSH Act, 2013", type: "Labour Court / Writ Petition" }
};

window.NYAYA_LANGUAGES = [
  { code: "en", label: "English" }, { code: "hi", label: "हिन्दी (Hindi)" }, { code: "mr", label: "मराठी (Marathi)" },
  { code: "bn", label: "বাংলা (Bengali)" }, { code: "ta", label: "தமிழ் (Tamil)" }, { code: "te", label: "తెలుగు (Telugu)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" }, { code: "kn", label: "ಕನ್ನಡ (Kannada)" }, { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" }, { code: "or", label: "ଓଡ଼ିଆ (Odia)" }, { code: "as", label: "অসমীয়া (Assamese)" }, { code: "ur", label: "اردو (Urdu)" }
];

window.NYAYA_I18N = {
  en: { tagline: "Verified Legal Case Intake, Advisor Directory & Case Mail", welcomeTitle: "Justice Made Accessible Across India", welcomeSub: "Connect with verified independent legal advisors & law firms.", newCase: "File a Legal Case", casePool: "Case Pools (Latest to Oldest)" },
  hi: { tagline: "सत्यापित कानूनी मामला पंजीकरण, सलाहकार निर्देशिका और केस मेल", welcomeTitle: "भारत भर में सुलभ न्याय", welcomeSub: "सत्यापित स्वतंत्र कानूनी सलाहकारों और लॉ फ़र्मों से जुड़ें।", newCase: "नया कानूनी मामला दर्ज करें", casePool: "केस पूल (नवीनतम पहले)" },
  mr: { tagline: "सत्यापित कायदेशीर प्रकरण नोंदणी, सल्लागार निर्देशिका व केस मेल", welcomeTitle: "संपूर्ण भारतात सुलभ न्याय", welcomeSub: "सत्यापित स्वतंत्र कायदेशीर सल्लागार व लॉ फर्मशी जोडा.", newCase: "नवीन कायदेशीर प्रकरण नोंदवा", casePool: "केस पूल (नवीन प्रथम)" },
  bn: { tagline: "যাচাইকৃত আইনি মামলা নিবন্ধন, পরামর্শদাতা ডিরেক্টরি ও কেস মেইল", welcomeTitle: "ভারতজুড়ে সহজলভ্য ন্যায়বিচার", welcomeSub: "যাচাইকৃত আইনজীবী ও ল ফার্মের সাথে যুক্ত হন।", newCase: "নতুন মামলা দায়ের করুন", casePool: "কেস পুল (নতুন প্রথম)" },
  ta: { tagline: "சரிபார்க்கப்பட்ட சட்ட வழக்கு பதிவு & ஆலோசகர் பட்டியல்", welcomeTitle: "இந்தியா முழுவதும் எளிய நீதி", welcomeSub: "சரிபார்க்கப்பட்ட சட்ட ஆலோசகர்கள் மற்றும் நிறுவனங்களுடன் இணையுங்கள்.", newCase: "புதிய வழக்கு பதிவு", casePool: "வழக்கு தொகுப்பு (புதியவை முதலில்)" },
  te: { tagline: "ధృవీకరించబడిన న్యాయ కేసు నమోదు & సలహాదారుల డైరెక్టరీ", welcomeTitle: "భారతదేశం అంతటా సులభమైన న్యాయం", welcomeSub: "ధృవీకరించబడిన న్యాయ సలహాదారులు మరియు సంస్థలతో కనెక్ట్ అవ్వండి.", newCase: "కొత్త కేసు నమోదు చేయండి", casePool: "ఓపెన్ కేస్ పూల్" },
  gu: { tagline: "ચકાસાયેલ કાનૂની કેસ નોંધણી અને સલાહકાર ડિરેક્ટરી", welcomeTitle: "સમગ્ર ભારતમાં સુલભ ન્યાય", welcomeSub: "ચકાસાયેલ કાનૂની સલાહકારો અને લો ફર્મ સાથે જોડાઓ.", newCase: "નવો કેસ નોંધો", casePool: "ઓપન કેસ પૂલ" },
  kn: { tagline: "ಪರಿಶೀಲಿತ ಕಾನೂನು ಪ್ರಕರಣ ನೋಂದಣಿ ಮತ್ತು ಸಲಹೆಗಾರರ ಡೈರೆಕ್ಟರಿ", welcomeTitle: "ಭಾರತದಾದ್ಯಂತ ಸುಲಭ ನ್ಯಾಯ", welcomeSub: "ಪರಿಶೀಲಿತ ಕಾನೂನು ಸಲಹೆಗಾರರು ಮತ್ತು ಸಂಸ್ಥೆಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.", newCase: "ಹೊಸ ಪ್ರಕರಣ ದಾಖಲಿಸಿ", casePool: "ಓಪನ್ ಕೇಸ್ ಪೂಲ್" }
};

window.NYAYA_CITY_COORDS = {
  "jabalpur":[23.18,79.98],"bhopal":[23.25,77.41],"indore":[22.71,75.85],"gwalior":[26.21,78.18],"mumbai":[19.07,72.87],"pune":[18.52,73.85],"nagpur":[21.14,79.08],"nashik":[19.99,73.78],"new delhi":[28.61,77.20],"delhi":[28.61,77.20],"lucknow":[26.84,80.94],"noida":[28.53,77.39],"bengaluru":[12.97,77.59],"chennai":[13.08,80.27],"hyderabad":[17.38,78.48],"kolkata":[22.57,88.36],"ahmedabad":[23.02,72.57],"surat":[21.17,72.83],"jaipur":[26.91,75.78],"patna":[25.59,85.13],"chandigarh":[30.73,76.77],"gurugram":[28.45,77.02],"kochi":[9.93,76.26],"bhubaneswar":[20.29,85.82],"guwahati":[26.14,91.73],"raipur":[21.25,81.62],"ranchi":[23.34,85.30],"dehradun":[30.31,78.03],"panaji":[15.49,73.82]
};
