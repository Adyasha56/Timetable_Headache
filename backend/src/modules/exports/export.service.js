const PDFDocument = require('pdfkit');
const ical = require('ical-generator').default ?? require('ical-generator');
const Schedule = require('../timetables/schedule.model');
const AppError = require('../../common/errors/AppError');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = ['08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];

const getSchedule = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId)
    .populate('dept_id', 'name code')
    .populate('semester_id', 'year semester')
    .populate('sessions.faculty_id', 'name')
    .populate('sessions.subject_id', 'name code')
    .populate('sessions.room_id', 'name');
  if (!schedule) throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  return schedule;
};

const exportPDF = async (scheduleId, res) => {
  const schedule = await getSchedule(scheduleId);
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="timetable-${scheduleId}.pdf"`);
  doc.pipe(res);

  // Title
  doc.fontSize(16).text(
    `Timetable — ${schedule.dept_id?.name} | ${schedule.semester_id?.year} Sem ${schedule.semester_id?.semester}`,
    { align: 'center' }
  );
  doc.moveDown();

  // Group sessions by day
  const byDay = {};
  DAYS.forEach((d, i) => { byDay[i + 1] = []; });
  schedule.sessions.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });

  // Draw each day
  DAYS.forEach((dayName, idx) => {
    const daySessions = byDay[idx + 1] || [];
    doc.fontSize(11).fillColor('#333').text(`${dayName}`, { underline: true });
    if (!daySessions.length) {
      doc.fontSize(9).fillColor('#999').text('  No sessions');
    } else {
      daySessions
        .sort((a, b) => a.slot - b.slot)
        .forEach((s) => {
          const time = SLOTS[s.slot] || `Slot ${s.slot}`;
          const subject = s.subject_id?.name || 'Unknown Subject';
          const faculty = s.faculty_id?.name || 'Unknown Faculty';
          const room = s.room_id?.name || 'Unknown Room';
          doc.fontSize(9).fillColor('#000').text(`  ${time}  |  ${subject}  |  ${faculty}  |  ${room}`);
        });
    }
    doc.moveDown(0.5);
  });

  doc.end();
};

const exportICal = async (scheduleId, semesterStartDate, res) => {
  const schedule = await getSchedule(scheduleId);
  const cal = ical({ name: `Timetable - ${schedule.dept_id?.name}` });

  const startDate = semesterStartDate ? new Date(semesterStartDate) : new Date();

  schedule.sessions.forEach((s) => {
    const subject = s.subject_id?.name || 'Class';
    const faculty = s.faculty_id?.name || '';
    const room = s.room_id?.name || '';

    // Find first occurrence of this weekday on or after startDate
    // DB day encoding: 1=Mon … 6=Sat; JS getDay(): 0=Sun, 1=Mon … 6=Sat
    // Convert Sunday (0) to 7 so ISO week arithmetic works cleanly
    const targetDay = s.day; // already 1=Mon … 6=Sat
    const startDay = startDate.getDay() === 0 ? 7 : startDate.getDay();
    const daysAhead = (targetDay - startDay + 7) % 7; // 0 means startDate itself is that weekday

    const eventDate = new Date(startDate);
    eventDate.setDate(startDate.getDate() + daysAhead);

    const [hour, min] = (SLOTS[s.slot] || '08:30').split(':').map(Number);
    eventDate.setHours(hour, min, 0, 0);
    const endDate = new Date(eventDate);
    endDate.setMinutes(endDate.getMinutes() + 60);

    cal.createEvent({
      start: eventDate,
      end: endDate,
      summary: subject,
      description: `Faculty: ${faculty}`,
      location: room,
      repeating: { freq: 'WEEKLY' },
    });
  });

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="timetable-${scheduleId}.ics"`);
  res.send(cal.toString());
};

module.exports = { exportPDF, exportICal };
