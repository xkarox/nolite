
# NoLite 📚

NoLite is a lightweight, file-based NoSQL database built on top of SQLite. It provides a simple and efficient way to store and retrieve data without the need for a full-fledged database server.

## Features ✨

- Lightweight and file-based
- Simple API for CRUD operations
- Built on top of SQLite

## Installation 📦

To install the dependencies, run:

```bash
npm install
```

## Usage 🚀

Here's a quick example of how to use NoSQLite:

```typescript
import { nolite } from "./src/index";

// Create a new database instance
const db = nolite.InFile("./data/mydb.db");

// Insert a document
await db.insert("/path/to/document", "This is some data");

// Read a document
const doc = await db.read("/path/to/document");
console.log(doc);

// Close the database
await db.close();
```

## Running Tests 🧪

To run the tests, use the following command:

```bash
npm test
```

## TODOs 📝

- [ ] Fully implement basic requirements
- [ ] Add pipeline for:
  - [ ] Testing
  - [ ] Publishing
  - [ ] README generation (readmeai)

## Contributing 🤝

Contributions are welcome! Please open an issue or submit a pull request.

## License 📄

This project is licensed under the MIT License.
