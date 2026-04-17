const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { httpLogger } = require('./common/logger');
const { errorHandler, notFound } = require('./common/middleware/error.middleware');
const { auditLog } = require('./common/middleware/audit.middleware');

const authRoutes          = require('./modules/auth/auth.routes');
const userRoutes          = require('./modules/users/user.routes');
const auditRoutes         = require('./modules/audit/audit.routes');
const departmentRoutes    = require('./modules/departments/department.routes');
const facultyRoutes       = require('./modules/faculty/faculty.routes');
const subjectRoutes       = require('./modules/subjects/subject.routes');
const roomRoutes          = require('./modules/rooms/room.routes');
const calendarRoutes      = require('./modules/calendars/calendar.routes');
const constraintRoutes    = require('./modules/constraints/constraint.routes');
const timetableRoutes     = require('./modules/timetables/timetable.routes');
const overrideRoutes      = require('./modules/overrides/override.routes');
const exportRoutes        = require('./modules/exports/export.routes');
const notificationRoutes  = require('./modules/notifications/notification.routes');
const sectionRoutes       = require('./modules/sections/section.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use(auditLog);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/audit',         auditRoutes);
app.use('/api/v1/departments',   departmentRoutes);
app.use('/api/v1/faculty',       facultyRoutes);
app.use('/api/v1/subjects',      subjectRoutes);
app.use('/api/v1/rooms',         roomRoutes);
app.use('/api/v1/calendars',     calendarRoutes);
app.use('/api/v1/constraints',   constraintRoutes);
app.use('/api/v1/timetables',    timetableRoutes);
app.use('/api/v1/overrides',     overrideRoutes);
app.use('/api/v1/exports',       exportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/sections',     sectionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
