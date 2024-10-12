import assert, { rejects } from "assert";
import sqlite3 from "sqlite3";
import * as fs from "fs";
import { resolve } from "path";

export class nolite
{
  private db: sqlite3.Database;
  private paths: string[] = [];

  private constructor(private databasePath: string)
  {
    this.db = new sqlite3.Database(databasePath);
    nolite.initDatabase(this.db);
  }

  public get Paths(): string[]
  {
    return this.paths;
  }

  public get DatabasePath(): string
  {
    return this.databasePath;
  }


  public get Sqlite3Database(): sqlite3.Database
  {
    return this.db;
  }

  public static InFile(path: string): nolite
  {
    assert(path !== ":memory:");
    if (path.startsWith(":memory:") || path == ":memory:")
    {
      throw new Error("Path cannot contain ':memory:'");
    }
    if (fs.existsSync(path))
    {
      return nolite.FromFile(path);
    }
    if (path.endsWith("/"))
    {
      throw new Error("Path cannot end with /");
    }
    // only create if path is in a subdir
    const directory = path.substring(0, path.lastIndexOf("/"));
    if (directory != "./")
    {
      const success = fs.mkdirSync(directory, {
        recursive: true,
      });
      if (success == undefined || success == null)
      {
        throw new Error("Failed to create directory");
      }
    }

    const instance = new nolite(path);
    return instance;
  }

  public static FromFile(path: string): nolite
  {
    if (fs.existsSync(path))
    {
      return new nolite(path);
    }
    throw new Error("Database file not found");
  }

  public static InMemory(): nolite
  {
    const instance = new nolite(":memory:");
    return instance;
  }

  public static initDatabase(databaseInstance: sqlite3.Database): void
  {
    databaseInstance.serialize(() =>
    {
      databaseInstance.run(`CREATE TABLE IF NOT EXISTS documents (
          path TEXT NOT NULL PRIMARY KEY,
          data TEXT,
          created INTEGER NOT NULL,
          updated INTEGER NOT NULL,
          UNIQUE(path)
        );`, (result: sqlite3.RunResult, err: Error | null) =>
      {
        console.log(result);
        console.log(err);
      });
    });
  }

  private checkDatabaseInitialized(): void
  {
    this.db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'",
      (err, row) =>
      {
        if (err)
        {
          throw new Error("Database not properly initialized.");
        }
        if (row === undefined)
        {
          throw new Error("Database not initialized.");
        }
      }
    );
  }

  private validatePathForRead(path: string): void
  {
    if (this.pathEndsWithNumber(path))
    {
      throw new Error("Path mustn't end with an integer");
    }
    if (!this.pathExists(path))
    {
      throw new Error("Path does not exist.");
    }
  }

  private validatePathForInsert(path: string): void
  {
    if (this.pathEndsWithNumber(path))
    {
      throw new Error("Path mustn't end with an integer");
    }
    // Additional validation logic for insert operations can be added here
  }

  private pathEndsWithNumber(path: string): boolean
  {
    const lastChar = path[path.length - 1];
    return !isNaN(parseInt(lastChar, 10));
  }

  private pathExists(path: string): boolean
  {
    return this.paths.includes(path);
  }

  public async insert(path: string, data: string): Promise<void>
  {
    this.checkDatabaseInitialized();
    this.validatePathForInsert(path);

    return new Promise((resolve, reject) =>
    {
      this.db.run(
        "INSERT INTO documents (path, data, created, updated) VALUES (?, ?, ?, ?)",
        [path, data, Date.now(), Date.now()],
        (err: Error | null) =>
        {
          if (err)
          {
            reject(new Error("Error inserting document."));
          } else
          {
            resolve();
          }
        }
      );
    });
  }

  public async read(path: string): Promise<any>
  {
    this.checkDatabaseInitialized();
    this.validatePathForRead(path);

    return new Promise((resolve, reject) =>
    {
      this.db.get(
        "SELECT * FROM documents WHERE path = ?",
        [path],
        (err: Error | null, row: any) =>
        {
          if (err)
          {
            reject(new Error("Error reading document."));
          } else
          {
            resolve(row);
          }
        }
      );
    });
  }

  public async get_collection(path: string): Promise<any[]>
  {
    this.checkDatabaseInitialized();
    this.validatePathForRead(path);

    let prefix: string;
    if (path.endsWith("/"))
    {
      prefix = path + "%";
    } else
    {
      prefix = path + "/%";
    }
    return new Promise((resolve, reject) =>
    {
      this.db.all(
        `SELECT * FROM documents WHERE (
          path LIKE ? AND
          (LENGTH(path) - LENGTH(REPLACE(path, '/', ''))) = (LENGTH(?) - LENGTH(REPLACE(?, '/', '')))
        )
        ORDER BY created;`,
        [prefix, prefix, prefix],
        (err: Error | null, rows: any[]) =>
        {
          if (err)
          {
            reject(new Error("Error reading all documents."));
          } else
          {
            resolve(rows);
          }
        }
      );
    });
  }

  public async update(path: string, data: string): Promise<void>
  {
    this.checkDatabaseInitialized();

    return new Promise((resolve, reject) =>
    {
      this.db.run(
        "UPDATE documents SET data = ?, updated = ? WHERE path = ?",
        [data, Date.now(), path],
        (err: Error | null) =>
        {
          if (err)
          {
            reject(new Error("Error updating document."));
          } else
          {
            resolve();
          }
        }
      );
    });
  }

  public async delete(path: string): Promise<void>
  {
    this.checkDatabaseInitialized();

    return new Promise((resolve, reject) =>
    {
      this.db.run(
        "DELETE FROM documents WHERE path = ?",
        [path],
        (err: Error | null) =>
        {
          if (err)
          {
            reject(new Error("Error deleting document."));
          } else
          {
            resolve();
          }
        }
      );
    });
  }

  public async close(): Promise<void>
  {
    return new Promise((resolve) =>
    {
      this.db.close((err) =>
      {
        if (err)
        {
          throw new Error("Error closing the database.");
        } else
        {
          resolve();
        }
      });
    });
  }
}
