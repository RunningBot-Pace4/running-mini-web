-- PostgreSQL schema equivalent for the Prisma data model.
-- In normal development, use: npx prisma migrate dev --name init

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE "VoteStatus" AS ENUM ('ATTEND', 'NOT_ATTEND');
CREATE TYPE "SubmissionStatus" AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "stravaAthleteId" BIGINT UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE "ScoreSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "attendancePoints" INTEGER NOT NULL DEFAULT 1,
  "perKmPoints" INTEGER NOT NULL DEFAULT 2,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "SiteContent" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "heroEyebrow" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroDescription" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "StravaToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "athleteId" BIGINT NOT NULL UNIQUE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "scope" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Event" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'OPEN',
  "createdById" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "EventVote" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" "VoteStatus" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("eventId", "userId")
);

CREATE TABLE "StravaActivity" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stravaId" BIGINT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sportType" TEXT,
  "distanceMeters" DOUBLE PRECISION NOT NULL,
  "movingTimeSec" INTEGER NOT NULL,
  "elapsedTimeSec" INTEGER,
  "startDate" TIMESTAMPTZ NOT NULL,
  "rawJson" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "stravaId")
);

CREATE TABLE "Submission" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "activityId" TEXT NOT NULL REFERENCES "StravaActivity"("id") ON DELETE RESTRICT,
  "distanceKm" DECIMAL(10,2) NOT NULL,
  "attendancePoints" INTEGER NOT NULL DEFAULT 1,
  "distancePoints" INTEGER NOT NULL,
  "totalPoints" INTEGER NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'APPROVED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("eventId", "userId", "activityId")
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startAt_endAt_idx" ON "Event"("startAt", "endAt");
CREATE INDEX "EventVote_userId_status_idx" ON "EventVote"("userId", "status");
CREATE INDEX "StravaActivity_userId_startDate_idx" ON "StravaActivity"("userId", "startDate");
CREATE INDEX "StravaActivity_type_idx" ON "StravaActivity"("type");
CREATE INDEX "Submission_eventId_status_idx" ON "Submission"("eventId", "status");
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
