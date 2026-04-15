const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { httpLogger } = require('./common/logger');
const { errorHandler, notFound } = require('./common/middleware/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const departmentRoutes = require('./modules/departments/department.routes');
const facultyRoutes = require('./modules/faculty/faculty.routes');
const subjectRoutes = require('./modules/subjects/subject.routes');
const roomRoutes = require('./modules/rooms/room.routes');
const calendarRoutes = require('./modules/calendars/calendar.routes');
const constraintRoutes = require('./modules/constraints/constraint.routes');
const timetableRoutes = require('./modules/timetables/timetable.routes');
const overrideRoutes = require('./modules/overrides/override.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/calendars', calendarRoutes);
app.use('/api/v1/constraints', constraintRoutes);
app.use('/api/v1/timetables', timetableRoutes);
app.use('/api/v1/overrides', overrideRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
