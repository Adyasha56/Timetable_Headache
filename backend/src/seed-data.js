require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('./config/env');

const User = require('./modules/users/user.model');
const Department = require('./modules/departments/department.model');
const Faculty = require('./modules/faculty/faculty.model');
const Subject = require('./modules/subjects/subject.model');
const Room = require('./modules/rooms/room.model');
const AcademicCalendar = require('./modules/calendars/calendar.model');

// ─── DEPARTMENTS ────────────────────────────────────────────
const DEPARTMENTS = [
  { code: 'CSE',  name: 'Computer Science and Engineering', room_group: 'Block A', active: true },
  { code: 'CIVIL',name: 'Civil Engineering',                room_group: 'Block B', active: true },
  { code: 'ECE',  name: 'Electronics and Communication',    room_group: 'Block A', active: true },
  { code: 'EEE',  name: 'Electrical and Electronics',       room_group: 'Block B', active: true },
  { code: 'MECH', name: 'Mechanical Engineering',           room_group: 'Block C', active: true },
  { code: 'MBA',  name: 'Master of Business Administration',room_group: 'Block D', active: true },
  { code: 'MCA',  name: 'Master of Computer Applications',  room_group: 'Block A', active: true },
];

// ─── ROOMS ──────────────────────────────────────────────────
// Scraped from timetable: 311, 313, 327, 117, 119, 123, 412, 416, 426, 503, 504, 111A
const ROOMS = [
  { name: 'Room 311',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 313',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 327',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 412',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 416',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 426',  type: 'classroom',  capacity: 60, amenities: ['projector', 'whiteboard'] },
  { name: 'Room 503',  type: 'seminar_hall', capacity: 100, amenities: ['projector', 'mic'] },
  { name: 'Room 504',  type: 'seminar_hall', capacity: 100, amenities: ['projector', 'mic'] },
  { name: 'Room 117',  type: 'lab', capacity: 30, amenities: ['computers', 'projector'] },
  { name: 'Room 119',  type: 'lab', capacity: 30, amenities: ['computers', 'projector'] },
  { name: 'Room 123',  type: 'lab', capacity: 30, amenities: ['equipment', 'projector'] },
  { name: 'Room 111A', type: 'lab', capacity: 30, amenities: ['computers', 'whiteboard'] },
];

// ─── FACULTY (scraped from gift.edu.in timetable) ───────────
// Format: [name, dept_code, type, expertise]
const FACULTY_DATA = [
  // CSE
  ['Dr. Suchitra Pattnaik',     'CSE', 'faculty', ['Artificial Intelligence', 'Machine Learning']],
  ['Dr. Anubha Pujary',         'CSE', 'faculty', ['Data Structures', 'Algorithms']],
  ['Saumendra Behera',          'CSE', 'faculty', ['Database Systems', 'Web Technology']],
  ['Dr. Saravanan R',           'CSE', 'faculty', ['Computer Networks', 'Cloud Computing']],
  ['Kalpataru Ojha',            'CSE', 'faculty', ['Operating Systems', 'Linux']],
  ['Tapas Kumar Parida',        'CSE', 'faculty', ['Programming', 'Data Structures']],
  ['Rojalini Behera',           'CSE', 'faculty', ['Mathematics', 'Discrete Structures']],
  ['Afreen Ali',                'CSE', 'faculty', ['English', 'Communication Skills']],
  ['Swarnananda Muduli',        'CSE', 'faculty', ['Physics', 'Engineering Physics']],
  ['Biswajeet Dash',            'CSE', 'lab_assistant', ['Programming Lab', 'Electronics Lab']],
  ['Dr. V Hemaja',              'CSE', 'faculty', ['VLSI', 'Digital Electronics']],
  ['Babuli Charan Sahoo',       'CSE', 'faculty', ['Mathematics', 'Numerical Methods']],

  // CIVIL
  ['Abdul Muntakim Khan',       'CIVIL', 'faculty', ['Organizational Behavior', 'Management']],
  ['Ajit Barik',                'CIVIL', 'faculty', ['Geology', 'General Elective']],
  ['Amiyajyoti Nayak',         'CIVIL', 'faculty', ['Surveying', 'Geo-Informatics']],
  ['Dr. Joy Krishna Dash',      'CIVIL', 'faculty', ['Structural Analysis', 'RCC Design']],
  ['Dr. Trilochan Sahu',        'CIVIL', 'faculty', ['Structural Analysis', 'Mechanics']],
  ['Dr. Himansu Bhusana Panigrahy', 'CIVIL', 'faculty', ['Environmental Engineering', 'Water Resources']],
  ['Abhijit Mangaraj',          'CIVIL', 'faculty', ['Thermal Engineering', 'Fluid Mechanics']],
  ['Akash Kumar Panda',         'CIVIL', 'faculty', ['Advanced Engineering Technology']],
  ['Dr. Debasree S',            'CIVIL', 'faculty', ['Project Management', 'Construction Technology']],

  // ECE
  ['Dr. Pallab Kumar Kar',      'ECE', 'faculty',       ['VLSI Design', 'Embedded Systems']],
  ['Dr. Manoranjan Mishra',     'ECE', 'faculty',       ['Signal Processing', 'Communication Systems']],
  ['Pradipta Kumar Pandia',     'ECE', 'faculty',       ['Microprocessors', 'Digital Electronics']],
  ['Chinmaya Kumar Swain',      'ECE', 'faculty',       ['Analog Electronics', 'Circuit Theory']],
  ['Subhashree Mohanty',        'ECE', 'lab_assistant', ['Electronics Lab', 'Signals Lab']],

  // EEE
  ['Dr. Prasanna Kumar Rout',   'EEE', 'faculty',       ['Power Systems', 'Electrical Machines']],
  ['Dr. Parshuram Sahoo',       'EEE', 'faculty',       ['Control Systems', 'Power Electronics']],
  ['Radha Raman Padhi',         'EEE', 'faculty',       ['Electrical Circuits', 'Network Theory']],
  ['Suresh Kumar Nayak',        'EEE', 'lab_assistant', ['Electrical Lab', 'Power Lab']],

  // MECH
  ['Dr. Kharabela Swain',       'MECH', 'faculty',       ['Thermodynamics', 'Heat Transfer']],
  ['Pradeep Kumar Swain',       'MECH', 'faculty',       ['Manufacturing Processes', 'CAD/CAM']],
  ['Dr. Ratikanta Dash',        'MECH', 'faculty',       ['Fluid Mechanics', 'Hydraulic Machines']],
  ['Deepak Kumar Sahu',         'MECH', 'lab_assistant', ['Thermodynamics Lab', 'Fluid Lab']],

  // MBA
  ['Dr. Md Khalid Khan',        'MBA', 'faculty', ['Finance', 'Accounting']],
  ['Gayatri Mohanty',           'MBA', 'faculty', ['Marketing', 'Human Resources']],
  ['Sitikantha Mohanty',        'MBA', 'faculty', ['Operations Management', 'Strategy']],

  // MCA
  ['Dr. Sasmita Hota',          'MCA', 'faculty', ['Advanced Algorithms', 'Software Engineering']],
  ['Swati Das',                 'MCA', 'faculty', ['Database Management', 'Web Development']],
  ['Tapaswini Parida',          'MCA', 'faculty', ['Computer Graphics', 'Multimedia']],
];

// ─── SUBJECTS ────────────────────────────────────────────────
// Format: [code, name, dept_code, type, credits, sessions_per_week, room_type]
// Target: 28-32 sessions/week per dept so the timetable looks full
const SUBJECTS_DATA = [
  // CSE 2nd Semester — 25 sessions/week (labs meet once/week for 2h)
  ['CS201', 'Programming Using Data Structures',       'CSE', 'theory', 4, 4, 'classroom'],
  ['CS201L','Programming Using Data Structures Lab',   'CSE', 'lab',    2, 1, 'lab'],
  ['CS202', 'Elements of Engineering Physics',         'CSE', 'theory', 3, 3, 'classroom'],
  ['CS202L','Elements of Engineering Physics Lab',     'CSE', 'lab',    1, 1, 'lab'],
  ['CS203', 'Mathematics-II',                          'CSE', 'theory', 4, 4, 'classroom'],
  ['CS204', 'Basic Civil Engineering',                 'CSE', 'theory', 3, 3, 'classroom'],
  ['CS204L','Basic Civil Engineering Lab',             'CSE', 'lab',    1, 1, 'lab'],
  ['CS205', 'Basic Electronics Engineering',           'CSE', 'theory', 3, 3, 'classroom'],
  ['CS205L','Basic Electronics Engineering Lab',       'CSE', 'lab',    1, 1, 'lab'],
  ['CS206', 'English For Engineers-II',                'CSE', 'theory', 2, 2, 'classroom'],
  ['CS206L','English For Engineers-II Lab',            'CSE', 'lab',    1, 1, 'lab'],

  // CIVIL 4th Semester — 24 sessions/week
  ['CV401', 'Structural Analysis-I',                   'CIVIL', 'theory', 4, 4, 'classroom'],
  ['CV402', 'Thermal Engineering-I',                   'CIVIL', 'theory', 4, 4, 'classroom'],
  ['CV403', 'Surveying-I',                             'CIVIL', 'theory', 3, 3, 'classroom'],
  ['CV404', 'Environmental Engineering',               'CIVIL', 'theory', 3, 3, 'classroom'],
  ['CV405', 'Organizational Behavior',                 'CIVIL', 'theory', 2, 2, 'classroom'],
  ['CV406', 'Construction Technology',                 'CIVIL', 'theory', 3, 3, 'classroom'],
  ['CV407', 'Engineering Geology',                     'CIVIL', 'theory', 3, 3, 'classroom'],
  ['CV408', 'Advanced Engineering Technology',         'CIVIL', 'theory', 2, 2, 'classroom'],
  ['CV401L','Thermal Engineering Lab',                 'CIVIL', 'lab',    1, 1, 'lab'],
  ['CV402L','Fluid Mechanics Lab',                     'CIVIL', 'lab',    1, 1, 'lab'],
  ['CV403L','Surveying Lab',                           'CIVIL', 'lab',    1, 1, 'lab'],

  // ECE 3rd Semester — 26 sessions/week
  ['EC301', 'Analog Electronics',                      'ECE', 'theory', 4, 4, 'classroom'],
  ['EC302', 'Digital Electronics',                     'ECE', 'theory', 4, 4, 'classroom'],
  ['EC303', 'Signals and Systems',                     'ECE', 'theory', 3, 3, 'classroom'],
  ['EC304', 'Electronic Devices and Circuits',         'ECE', 'theory', 4, 4, 'classroom'],
  ['EC305', 'Communication Systems',                   'ECE', 'theory', 3, 3, 'classroom'],
  ['EC306', 'Electromagnetic Fields Theory',           'ECE', 'theory', 3, 3, 'classroom'],
  ['EC301L','Analog Electronics Lab',                  'ECE', 'lab',    1, 1, 'lab'],
  ['EC302L','Digital Electronics Lab',                 'ECE', 'lab',    1, 1, 'lab'],
  ['EC303L','Signals and Systems Lab',                 'ECE', 'lab',    1, 1, 'lab'],

  // EEE 3rd Semester — 25 sessions/week
  ['EE301', 'Electrical Machines',                     'EEE', 'theory', 4, 4, 'classroom'],
  ['EE302', 'Power Systems',                           'EEE', 'theory', 4, 4, 'classroom'],
  ['EE303', 'Power Electronics',                       'EEE', 'theory', 4, 4, 'classroom'],
  ['EE304', 'Control Systems',                         'EEE', 'theory', 3, 3, 'classroom'],
  ['EE305', 'Electrical Measurements',                 'EEE', 'theory', 3, 3, 'classroom'],
  ['EE306', 'Network Theory',                          'EEE', 'theory', 3, 3, 'classroom'],
  ['EE307', 'Mathematics for EEE',                     'EEE', 'theory', 3, 3, 'classroom'],
  ['EE301L','Electrical Machines Lab',                 'EEE', 'lab',    1, 1, 'lab'],
  ['EE302L','Power Systems Lab',                       'EEE', 'lab',    1, 1, 'lab'],

  // MECH 3rd Semester — 26 sessions/week
  ['ME301', 'Thermodynamics',                          'MECH', 'theory', 4, 4, 'classroom'],
  ['ME302', 'Fluid Mechanics',                         'MECH', 'theory', 4, 4, 'classroom'],
  ['ME303', 'Theory of Machines',                      'MECH', 'theory', 4, 4, 'classroom'],
  ['ME304', 'Manufacturing Technology',                'MECH', 'theory', 3, 3, 'classroom'],
  ['ME305', 'Heat Transfer',                           'MECH', 'theory', 3, 3, 'classroom'],
  ['ME306', 'Engineering Materials',                   'MECH', 'theory', 3, 3, 'classroom'],
  ['ME307', 'Industrial Engineering',                  'MECH', 'theory', 3, 3, 'classroom'],
  ['ME301L','Thermodynamics Lab',                      'MECH', 'lab',    1, 1, 'lab'],
  ['ME302L','Fluid Mechanics Lab',                     'MECH', 'lab',    1, 1, 'lab'],

  // MBA 1st Semester — 25 sessions/week
  ['MB201', 'Financial Management',                    'MBA', 'theory', 4, 4, 'classroom'],
  ['MB202', 'Marketing Management',                    'MBA', 'theory', 4, 4, 'classroom'],
  ['MB203', 'Human Resource Management',               'MBA', 'theory', 4, 4, 'classroom'],
  ['MB204', 'Operations Management',                   'MBA', 'theory', 3, 3, 'classroom'],
  ['MB205', 'Business Analytics',                      'MBA', 'theory', 3, 3, 'classroom'],
  ['MB206', 'Managerial Economics',                    'MBA', 'theory', 4, 4, 'classroom'],
  ['MB207', 'Organizational Behavior',                 'MBA', 'theory', 3, 3, 'classroom'],
  ['MB208', 'Business Communication',                  'MBA', 'theory', 2, 2, 'classroom'],

  // MCA 1st Semester — 26 sessions/week
  ['MC201', 'Advanced Algorithms',                     'MCA', 'theory', 4, 4, 'classroom'],
  ['MC202', 'Software Engineering',                    'MCA', 'theory', 4, 4, 'classroom'],
  ['MC203', 'Computer Networks',                       'MCA', 'theory', 4, 4, 'classroom'],
  ['MC204', 'Operating Systems',                       'MCA', 'theory', 3, 3, 'classroom'],
  ['MC205', 'Database Management Systems',             'MCA', 'theory', 3, 3, 'classroom'],
  ['MC206', 'Web Technologies',                        'MCA', 'theory', 3, 3, 'classroom'],
  ['MC201L','Algorithms Lab',                          'MCA', 'lab',    2, 1, 'lab'],
  ['MC202L','Software Engineering Lab',                'MCA', 'lab',    2, 1, 'lab'],
  ['MC203L','Networks Lab',                            'MCA', 'lab',    1, 1, 'lab'],
];

// ─── SEED FUNCTION ──────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Faculty.deleteMany({}),
    Subject.deleteMany({}),
    Room.deleteMany({}),
    AcademicCalendar.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // 1. Admin user
  await User.create({
    name: 'Admin',
    email: 'admin@gift.edu.in',
    password_hash: 'admin123',
    role: 'admin',
    status: 'active',
  });
  console.log('Admin user created → admin@gift.edu.in / admin123');

  // 2. Departments
  const deptDocs = await Department.insertMany(DEPARTMENTS);
  const deptMap = {};
  deptDocs.forEach((d) => { deptMap[d.code] = d._id; });
  console.log(`Departments created: ${deptDocs.length}`);

  // 3. Rooms (assign to CSE dept for shared rooms, null for open rooms)
  // Block slot 5 (13:00–14:00) as lunch break on all 6 days for every room
  const lunchSlots = [0, 1, 2, 3, 4, 5].map((day) => ({ day, slot: 5 }));
  const roomDocs = await Room.insertMany(
    ROOMS.map((r) => ({ ...r, dept_id: deptMap['CSE'], blocked_slots: lunchSlots, active: true }))
  );
  console.log(`Rooms created: ${roomDocs.length}`);

  // 4. Faculty users + faculty records
  const hashedFacultyPw = await bcrypt.hash('faculty123', 10);
  const facultyUsers = await User.insertMany(
    FACULTY_DATA.map(([name, dept]) => ({
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@gift.edu.in`,
      password_hash: hashedFacultyPw,
      role: 'faculty',
      dept_id: deptMap[dept],
      status: 'active',
    }))
  );

  const facultyDocs = await Faculty.insertMany(
    FACULTY_DATA.map(([name, dept, type, expertise], i) => ({
      user_id: facultyUsers[i]._id,
      name,
      dept_id: deptMap[dept],
      type,
      expertise,
      max_hours_per_week: type === 'lab_assistant' ? 24 : 18,
      availability: Array(6).fill(Array(8).fill(true)),
      preferences: { preferred_slots: [], avoid_slots: [] },
      joined_date: new Date('2018-07-01'),
      status: 'active',
      is_probation: false,
    }))
  );
  console.log(`Faculty created: ${facultyDocs.length}`);

  // 5. Subjects
  const subjectDocs = await Subject.insertMany(
    SUBJECTS_DATA.map(([code, name, dept, type, credits, sessions_per_week, room_type]) => ({
      code,
      name,
      dept_id: deptMap[dept],
      type,
      credits,
      sessions_per_week,
      session_duration_slots: type === 'lab' ? 2 : 1,
      batch_count: type === 'lab' ? 3 : 1,
      requires_lab_assistant: type === 'lab',
      room_type_required: room_type,
      enrollment: 60,
      active: true,
    }))
  );
  console.log(`Subjects created: ${subjectDocs.length}`);

  // 6. Academic Calendar (current odd semester)
  const calendar = await AcademicCalendar.create({
    year: 2026,
    semester: 1,
    start_date: new Date('2026-07-01'),
    end_date: new Date('2026-11-30'),
    holidays: [
      new Date('2026-08-15'), // Independence Day
      new Date('2026-10-02'), // Gandhi Jayanti
      new Date('2026-10-20'), // Dussehra
      new Date('2026-11-01'), // Diwali
    ],
    half_days: [
      new Date('2026-09-05'), // Teachers Day
    ],
    events: [
      {
        date: new Date('2026-09-20'),
        name: 'Annual Sports Day',
        slots_blocked: [{ day: 6, slot: 1 }, { day: 6, slot: 2 }],
      },
    ],
  });
  console.log(`Academic Calendar created: ${calendar.year} Semester ${calendar.semester}`);

  // ─── SUMMARY ────────────────────────────────────────────
  console.log('\n─────────────────────────────────────');
  console.log('Seed complete. Summary:');
  console.log(`  Admin       : admin@gift.edu.in / admin123`);
  console.log(`  Departments : ${deptDocs.length}`);
  console.log(`  Rooms       : ${roomDocs.length}`);
  console.log(`  Faculty     : ${facultyDocs.length}`);
  console.log(`  Subjects    : ${subjectDocs.length}`);
  console.log(`  Calendar    : 2026 Semester 1`);
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
