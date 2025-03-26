# Name Game

A web application to help instructors learn and remember student names. This tool provides an interactive way to practice matching names with faces, add tags for grouping students, and track your performance.

## Features

- **Student Database**: Maintain a database of students with names and photos
- **Name Learning Game**: Practice matching names to faces with various game modes
- **Tagging System**: Organize students with custom tags for group formation or categorization
- **Performance Tracking**: Monitor your progress learning student names
- **Batch Operations**: Efficiently manage large sets of students
- **Preferred Name Support**: Handle nicknames and preferred names

## Getting Started

### Prerequisites

- Node.js (16.x or later)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd name-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Access the application:
   Open your browser and navigate to `http://localhost:8080`

## Usage

### Adding Students

Students can be added individually through the web interface, or in batch via script. Each student should have a first name, last name, and an associated image.

### Playing the Game

1. Select the game mode (multiple choice, short answer, etc.)
2. Choose tags to filter the student pool (optional)
3. Practice identifying students and track your progress

### Managing Tags

Create and manage tags to organize students into groups or categories, making it easier to focus on specific sets of students when practicing.

## Technical Details

- **Backend**: Node.js with Express
- **Database**: File-based JSON storage
- **Frontend**: Vanilla JavaScript with responsive design

## License

MIT