const messageLibrary = [
    {
        "category": "Attendance",
        "title": "Student Absent",
        "message": "Dear Parent,\nThis is to inform you that {Student Name} of Class {Class} is absent today, {Date}. Please submit a leave letter upon their return.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Attendance",
        "title": "Student Late Arrival",
        "message": "Dear Parent,\n{Student Name} arrived late to school today at {Time}. Please ensure they reach on time to avoid missing morning activities.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Attendance",
        "title": "Continuous Absence",
        "message": "Dear Parent,\n{Student Name} has been absent for the past {Number} days without intimation. Kindly contact the school office at the earliest.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Attendance",
        "title": "Attendance Appreciation",
        "message": "Dear Parent,\nWe are pleased to share that {Student Name} has 100% attendance this month. Thank you for ensuring their regularity.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Attendance",
        "title": "Sick Student",
        "message": "Dear Parent,\n{Student Name} is feeling unwell at school. Please arrange to pick them up from the school office as soon as possible.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Homework",
        "title": "Homework Assigned",
        "message": "Dear Parent,\nHomework for {Subject} has been assigned to {Student Name}. Please ensure it is completed and submitted by {Due Date}.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Homework",
        "title": "Homework Reminder",
        "message": "Dear Parent,\nThis is a gentle reminder that {Student Name}'s homework for {Subject} is due on {Due Date}.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Homework",
        "title": "Homework Not Submitted",
        "message": "Dear Parent,\n{Student Name} has not submitted today's {Subject} homework. Kindly ensure the pending work is completed and brought tomorrow.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Homework",
        "title": "Project Submission Reminder",
        "message": "Dear Parent,\nPlease note that the final project for {Subject} is due on {Date}. Ensure {Student Name} brings the completed project to school.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Fees",
        "title": "Fee Due Reminder",
        "message": "Dear Parent,\nThis is a reminder that the school fee of {Amount} for {Student Name} is due. Please make the payment by {Due Date}.\n\nRegards,\nManagement, SLT Public School\nslte.in"
    },
    {
        "category": "Fees",
        "title": "Fee Due Tomorrow",
        "message": "Dear Parent,\nThe last date to pay the school fee of {Amount} for {Student Name} is tomorrow, {Date}. Kindly pay on time to avoid late charges.\n\nRegards,\nManagement, SLT Public School\nslte.in"
    },
    {
        "category": "Fees",
        "title": "Last Reminder",
        "message": "Dear Parent,\nToday is the final day to submit the school fee for {Student Name} without penalty. Please ensure the payment of {Amount} is made today.\n\nRegards,\nManagement, SLT Public School\nslte.in"
    },
    {
        "category": "Fees",
        "title": "Fee Received Confirmation",
        "message": "Dear Parent,\nWe have received your fee payment of {Amount} for {Student Name} on {Date}. Thank you for your prompt payment.\n\nRegards,\nManagement, SLT Public School\nslte.in"
    },
    {
        "category": "Fees",
        "title": "Overdue Fees",
        "message": "Dear Parent,\nThe school fee of {Amount} for {Student Name} is now overdue. Please contact the school office immediately to clear the balance.\n\nRegards,\nManagement, SLT Public School\nslte.in"
    },
    {
        "category": "Parent-Teacher Meeting (PTA)",
        "title": "PTA Invitation",
        "message": "Dear Parent,\nYou are invited to the Parent-Teacher Meeting on {Date} between {Time}. We look forward to discussing {Student Name}'s academic progress.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Parent-Teacher Meeting (PTA)",
        "title": "PTA Reminder",
        "message": "Dear Parent,\nThis is a reminder for the Parent-Teacher Meeting tomorrow, {Date}, at {Time}. We request your presence to discuss {Student Name}'s performance.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Parent-Teacher Meeting (PTA)",
        "title": "PTA Rescheduled",
        "message": "Dear Parent,\nThe Parent-Teacher Meeting originally scheduled for {Date} has been rescheduled to {New Date} at {New Time}. We apologize for the inconvenience.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Parent-Teacher Meeting (PTA)",
        "title": "Thank You for Attending",
        "message": "Dear Parent,\nThank you for attending today's Parent-Teacher Meeting. We appreciate your time and continuous support in {Student Name}'s education.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Parent-Teacher Meeting (PTA)",
        "title": "Parent Requested to Visit School",
        "message": "Dear Parent,\nYou are requested to visit the school office on {Date} at {Time} to meet with the {Teacher Name} regarding {Student Name}.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "Holidays",
        "title": "School Holiday",
        "message": "Dear Parent,\nThe school will remain closed on {Date} for {Holiday Name}. Regular classes will resume on {Next Date}.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Holidays",
        "title": "Unexpected Holiday",
        "message": "Dear Parent,\nThe school will remain closed today, {Date}, due to {Reason}. We apologize for the short notice.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Holidays",
        "title": "Holiday Extended",
        "message": "Dear Parent,\nThe current school holidays have been extended until {Date} due to {Reason}. Classes will now resume on {New Date}.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Holidays",
        "title": "School Reopens",
        "message": "Dear Parent,\nThe school will reopen on {Date} after the holidays. We look forward to welcoming {Student Name} back.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Exam Schedule Released",
        "message": "Dear Parent,\nThe schedule for the {Exam Name} is now available. Please check the student portal or school diary for detailed timings.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Exam Hall Ticket",
        "message": "Dear Parent,\nThe hall ticket for the upcoming {Exam Name} has been issued to {Student Name} today. Please ensure they carry it for all exams.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Exam Starts Tomorrow",
        "message": "Dear Parent,\nThe {Exam Name} begins tomorrow, {Date}. Please ensure {Student Name} arrives at school by {Time} with all necessary stationery.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Practical Examination",
        "message": "Dear Parent,\nThe practical examination for {Subject} is on {Date} at {Time}. Please ensure {Student Name} brings their completed record book.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Exam Postponed",
        "message": "Dear Parent,\nThe {Exam Name} scheduled for {Date} is postponed due to {Reason}. The revised date will be communicated shortly.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Results Published",
        "message": "Dear Parent,\nThe results for the {Exam Name} are now published. You can view {Student Name}'s report card on the school portal.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Exams",
        "title": "Report Card Collection",
        "message": "Dear Parent,\nPlease collect {Student Name}'s report card from the school office on {Date} between {Time}.\n\nRegards,\nExamination Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Annual Day",
        "message": "Dear Parent,\nWe invite you to our Annual Day celebration on {Date} at {Time} at {Venue}. We hope to see you there to support our students.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Sports Day",
        "message": "Dear Parent,\nYou are invited to join our Annual Sports Day on {Date} starting at {Time}. Please come and encourage the participants.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Science Exhibition",
        "message": "Dear Parent,\nOur students will present their projects at the Science Exhibition on {Date} from {Time}. We invite you to visit and appreciate their hard work.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Cultural Programme",
        "message": "Dear Parent,\nWe invite you to our Cultural Programme on {Date} at {Venue}. Join us at {Time} to enjoy the performances by our students.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Independence Day",
        "message": "Dear Parent,\nThe Independence Day flag hoisting ceremony will take place on {Date} at {Time}. Students should attend in their regular uniform.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Republic Day",
        "message": "Dear Parent,\nWe invite you to the Republic Day celebrations on {Date} at {Time} on the school premises. Let us celebrate our nation together.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Investiture Ceremony",
        "message": "Dear Parent,\nWe invite you to attend the Investiture Ceremony on {Date} at {Time}, where our new student council will officially take charge.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Events",
        "title": "Special Assembly",
        "message": "Dear Parent,\nA Special Assembly will be held on {Date} for {Reason}. Please ensure {Student Name} arrives at school by {Time}.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Diwali",
        "message": "Dear Parent,\nWishing you and your family a safe, bright, and prosperous Diwali. May the festival of lights bring you joy.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Christmas",
        "message": "Dear Parent,\nWishing you and your family a Merry Christmas. May your holidays be filled with peace, love, and happiness.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Eid",
        "message": "Dear Parent,\nWishing you and your family a blessed Eid Mubarak. May this special day bring peace and prosperity to your home.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Onam",
        "message": "Dear Parent,\nWishing you and your family a very happy and prosperous Onam. May the festival bring joy and harmony.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Vishu",
        "message": "Dear Parent,\nWishing you a Happy Vishu. May this new year bring joy, health, and success to your family.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Ugadi",
        "message": "Dear Parent,\nWishing you a very Happy Ugadi. May the new year usher in peace and prosperity for you and your loved ones.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Ganesh Chaturthi",
        "message": "Dear Parent,\nWishing you a blessed Ganesh Chaturthi. May Lord Ganesha remove all obstacles and bring success to your family.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "New Year",
        "message": "Dear Parent,\nWishing you and your family a very Happy New Year. May the coming year bring health, happiness, and new achievements.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Teacher's Day",
        "message": "Dear Parent,\nToday we celebrate Teacher's Day. We thank you for your continuous support in helping our educators shape bright futures.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Festival Greetings",
        "title": "Children's Day",
        "message": "Dear Parent,\nWishing all our students a very Happy Children's Day. May their lives always be filled with joy and curiosity.\n\nRegards,\nPrincipal, SLT Public School\nslte.in"
    },
    {
        "category": "Transport",
        "title": "Bus Delay",
        "message": "Dear Parent,\nSchool Bus {Bus Number} on Route {Route} is delayed by approximately {Time} minutes due to traffic. We appreciate your patience.\n\nRegards,\nTransport Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Transport",
        "title": "Bus Cancellation",
        "message": "Dear Parent,\nSchool Bus {Bus Number} is not operating today due to {Reason}. Kindly make alternate arrangements to drop and pick up {Student Name}.\n\nRegards,\nTransport Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Transport",
        "title": "Route Changed",
        "message": "Dear Parent,\nDue to {Reason}, the route for School Bus {Bus Number} has temporarily changed today. Pickup and drop times may vary slightly.\n\nRegards,\nTransport Dept, SLT Public School\nslte.in"
    },
    {
        "category": "Transport",
        "title": "Transport Fee Reminder",
        "message": "Dear Parent,\nThis is a reminder that the school transport fee of {Amount} for {Student Name} is due on {Date}. Please ensure timely payment.\n\nRegards,\nTransport Dept, SLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Uniform Reminder",
        "message": "Dear Parent,\nPlease ensure that {Student Name} comes to school in the complete and correct school uniform, including proper footwear.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Bring Books",
        "message": "Dear Parent,\nPlease ensure {Student Name} brings the {Subject} textbook and notebook to school tomorrow.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Bring ID Card",
        "message": "Dear Parent,\n{Student Name} reported to school today without their ID card. Please ensure they wear it every day for security reasons.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Discipline Notice",
        "message": "Dear Parent,\nWe need to inform you about a disciplinary issue involving {Student Name} today regarding {Reason}. Please contact the class teacher for details.\n\nRegards,\nClass Teacher, SLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Consent Form Reminder",
        "message": "Dear Parent,\nThe consent form for {Reason} is due on {Date}. Please sign and return it with {Student Name} tomorrow.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Library Book Reminder",
        "message": "Dear Parent,\n{Student Name} has an overdue library book titled {Reason}. Please ensure it is returned to the school library tomorrow.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Lost and Found",
        "message": "Dear Parent,\nAn item belonging to {Student Name} has been found on the school premises. Please instruct them to collect it from the school office.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "School Timing Change",
        "message": "Dear Parent,\nThe school timings will change effective from {Date}. The new timings will be {Time} to {Time}.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "General Notices",
        "title": "Circular Released",
        "message": "Dear Parent,\nAn important circular regarding {Reason} has been sent home with {Student Name}. Please review it carefully.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Excursions",
        "title": "School Picnic",
        "message": "Dear Parent,\nThe school picnic for Class {Class} is scheduled for {Date} at {Venue}. Please refer to the circular for reporting times and details.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Excursions",
        "title": "Educational Tour",
        "message": "Dear Parent,\nAn educational tour to {Venue} is organized for Class {Class} on {Date}. Kindly submit the consent form and fee by {Due Date}.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "School Closed",
        "message": "Dear Parent,\nThe school will remain closed today, {Date}, due to {Reason}. Please do not send your child to school. Further updates will follow.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "Heavy Rain Notice",
        "message": "Dear Parent,\nDue to heavy rainfall, the school is declaring a holiday today, {Date}. Please stay safe indoors.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "Health Advisory",
        "message": "Dear Parent,\nAs a precaution against {Reason}, we request you not to send {Student Name} to school if they show any symptoms of illness.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "Medical Check-up",
        "message": "Dear Parent,\nA routine medical check-up is scheduled for {Student Name} on {Date} at school.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "Vaccination Notice",
        "message": "Dear Parent,\nA vaccination drive for {Reason} will be held at school on {Date}. Please submit the consent form if you wish {Student Name} to participate.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Health & Emergency",
        "title": "Emergency Information",
        "message": "Dear Parent,\nThis is an emergency alert regarding {Reason}. All students are safe on campus. Please follow the instructions sent to your email.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Appreciation",
        "title": "Congratulations",
        "message": "Dear Parent,\nCongratulations! {Student Name} has been recognized for {Reason}. We appreciate their hard work and dedication.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Appreciation",
        "title": "Excellent Performance",
        "message": "Dear Parent,\nWe are delighted to share that {Student Name} has achieved excellent results in the {Exam Name}. Congratulations on this outstanding performance.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Appreciation",
        "title": "Competition Winner",
        "message": "Dear Parent,\nCongratulations! {Student Name} has secured the first position in the {Event Name}. We are very proud of this achievement.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Appreciation",
        "title": "Attendance Award",
        "message": "Dear Parent,\nWe are proud to award {Student Name} for maintaining 100% attendance this academic year. Thank you for your support.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Admissions",
        "title": "Admission Confirmed",
        "message": "Dear Parent,\nWe are pleased to inform you that the admission for {Student Name} to Class {Class} is confirmed. Please visit the office to complete the formalities.\n\nRegards,\nAdmissions Office, SLT Public School\nslte.in"
    },
    {
        "category": "Admissions",
        "title": "Documents Required",
        "message": "Dear Parent,\nYour admission application for {Student Name} is incomplete. Please submit the pending {Reason} document to the office by {Date}.\n\nRegards,\nAdmissions Office, SLT Public School\nslte.in"
    },
    {
        "category": "Admissions",
        "title": "Admission Interview",
        "message": "Dear Parent,\nAn admission interaction for {Student Name} is scheduled on {Date} at {Time}. Both parents are requested to be present.\n\nRegards,\nAdmissions Office, SLT Public School\nslte.in"
    },
    {
        "category": "Admissions",
        "title": "Welcome to School",
        "message": "Dear Parent,\nWelcome to the {School Name} family! We look forward to a wonderful academic year with {Student Name}. The session begins on {Date}.\n\nRegards,\nAdmissions Office, SLT Public School\nslte.in"
    },
    {
        "category": "Miscellaneous",
        "title": "Birthday Wishes",
        "message": "Dear Parent,\nThe management and staff of {School Name} wish {Student Name} a very Happy Birthday! We hope they have a wonderful year ahead.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Miscellaneous",
        "title": "Welcome Back",
        "message": "Dear Parent,\nWelcome back! We are excited to see {Student Name} return to school today. Let's make this new term productive and successful.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Miscellaneous",
        "title": "Thank You",
        "message": "Dear Parent,\nThank you for your active participation in {Event Name}. Your involvement contributes greatly to our school community.\n\nRegards,\nSLT Public School\nslte.in"
    },
    {
        "category": "Miscellaneous",
        "title": "General Announcement",
        "message": "Dear Parent,\nPlease be informed that {Reason}. For more details, please contact the school administration office.\n\nRegards,\nSLT Public School\nslte.in"
    }
];
