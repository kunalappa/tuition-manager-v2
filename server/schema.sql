DROP DATABASE IF EXISTS tuition_manager;
CREATE DATABASE tuition_manager CHARACTER SET utf8mb4;
USE tuition_manager;

CREATE TABLE tutors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  schedule VARCHAR(120),
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_name VARCHAR(100),
  parent_phone VARCHAR(20),
  parent_code CHAR(8) NOT NULL UNIQUE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_date DATE NOT NULL,
  status ENUM('present','absent','late') NOT NULL,
  UNIQUE KEY one_per_day (student_id, class_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  month CHAR(7) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('paid','pending') NOT NULL DEFAULT 'pending',
  paid_on DATE NULL,
  UNIQUE KEY one_per_month (student_id, month),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE question_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  questions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  qa JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);
CREATE TABLE note_progress (
  student_id INT NOT NULL,
  note_id INT NOT NULL,
  done_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, note_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
