import { nosqlite } from "../src/index";
import sqlite3 from "sqlite3";
import * as fs from "fs";
import { before } from "node:test";

describe("nosqlite", () =>
{
  describe("nosqlite.Getter", () =>
  {
    let instance: nosqlite;
    const memoryPath: string = ":memory:";

    beforeAll(() =>
    {
      instance = nosqlite.InMemory();
    });

    afterAll(() =>
    {
      instance.close();
    });

    test("should return the paths", () =>
    {
      const paths = instance.Paths;
      expect(paths).toBeInstanceOf(Array<string>);
      expect(paths.length).toBe(0);
    });

    test("should return the database path", () =>
    {
      const databasePath = instance.DatabasePath;
      expect(databasePath).toBe(memoryPath);
    });

    test("should return the underlying sqlite3 db", () =>
    {
      const sqlite3Instance = instance.Sqlite3Database;
      expect(sqlite3Instance).toBeInstanceOf(sqlite3.Database);
    });
  });
  describe("nosqlite.InFile", () =>
  {
    const validPath = "./testDir/test.db";
    const invalidMemoryPath = ":memory:test.db";
    const existingFilePath = "./existingDir/existing.db";
    const pathEndingWithSlash = "./testDir/";

    beforeEach(() =>
    {
      // Clean up before each test
      if (fs.existsSync(validPath))
      {
        fs.rmSync(validPath);
      }
      if (fs.existsSync(existingFilePath))
      {
        fs.rmSync(existingFilePath);
      }
      if (fs.existsSync("./testDir"))
      {
        fs.rmSync("./testDir", { recursive: true });
      }
      if (fs.existsSync("./existingDir"))
      {
        fs.rmSync("./existingDir", { recursive: true });
      }
    });

    test("should create a new nosqlite instance with a valid path", () =>
    {
      const instance = nosqlite.InFile(validPath);
      expect(instance).toBeInstanceOf(nosqlite);
      expect(instance.DatabasePath).toBe(validPath);
      expect(fs.existsSync(validPath)).toBe(true);
    });

    test("should throw an error if path starts with :memory:", () =>
    {
      expect(() =>
      {
        nosqlite.InFile(invalidMemoryPath);
      }).toThrow("Path cannot contain ':memory:'");
    });

    test("should throw an error if path ends with /", () =>
    {
      expect(() =>
      {
        nosqlite.InFile(pathEndingWithSlash);
      }).toThrow("Path cannot end with /");
    });
  });
  describe("nosqlite.FromFile", () =>
  {
    const invalidPath: string = "./invalid/invalid.db";
    const validPath: string = "./validDir/validTest.db";
    const validPathDir: string = "./validDir";

    beforeEach(() =>
    {
      if (fs.existsSync(validPath))
      {
        fs.rmSync(validPath);
      }
      if (fs.existsSync(validPathDir))
      {
        fs.rmdirSync(validPathDir, { recursive: true });
      }
      fs.mkdirSync(validPathDir, { recursive: true });
    });

    afterEach(() =>
    {
      if (fs.existsSync(validPath))
      {
        fs.rmSync(validPath);
      }
      if (fs.existsSync(validPathDir))
      {
        fs.rmdirSync(validPathDir, { recursive: true });
      }
    });


    test("should throw an error when passing invalid path", () =>
    {
      expect(() => nosqlite.FromFile(invalidPath)).toThrow("Database file not found");
    });

    test("should create a database from existing file", async () =>
    {
      const origin = nosqlite.InFile(validPath);
      await origin.close();
      const instance = nosqlite.FromFile(validPath);
      expect(instance).toBeInstanceOf(nosqlite);
    });
  });
});
