exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name       TEXT NOT NULL,
      username   TEXT UNIQUE NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title         TEXT NOT NULL CHECK (char_length(title) <= 100),
      category      TEXT NOT NULL DEFAULT 'General'
                    CHECK (category IN ('General','Health','Fitness','Learning',
                                        'Mindfulness','Productivity','Social','Finance')),
      difficulty    TEXT NOT NULL DEFAULT 'Medium'
                    CHECK (difficulty IN ('Easy','Medium','Hard')),
      reminder_time TEXT,
      created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      habit_id   UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date       DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total_points INTEGER NOT NULL DEFAULT 0,
      level        INTEGER NOT NULL DEFAULT 1,
      updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS badges (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name        TEXT NOT NULL,
      description TEXT,
      icon        TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      earned_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title       TEXT NOT NULL,
      description TEXT,
      points      INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_challenges (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS streak_milestones (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      milestone  INTEGER NOT NULL,
      awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, milestone)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_habits_user_id          ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id     ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_user_stats_user_id      ON user_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user_id     ON user_badges(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username          ON users(username);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS streak_milestones CASCADE;
    DROP TABLE IF EXISTS user_challenges CASCADE;
    DROP TABLE IF EXISTS challenges CASCADE;
    DROP TABLE IF EXISTS user_badges CASCADE;
    DROP TABLE IF EXISTS badges CASCADE;
    DROP TABLE IF EXISTS user_stats CASCADE;
    DROP TABLE IF EXISTS habit_logs CASCADE;
    DROP TABLE IF EXISTS habits CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
};