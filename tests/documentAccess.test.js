const test = require("node:test");
const assert = require("node:assert/strict");
const { canReadDocument, canEditDocument, canManageDocument } = require("../middleware/documentAccess");

const owner = { id: 1, role: "owner" };
const reader = { id: 2, role: "owner" };
const editor = { id: 3, role: "owner" };
const admin = { id: 4, role: "admin" };
const document = { owner_id: 1, permission: null };

test("owner can read, edit, and manage their document", () => {
  assert.equal(canReadDocument(document, owner), true);
  assert.equal(canEditDocument(document, owner), true);
  assert.equal(canManageDocument(document, owner), true);
});

test("read permission allows reading but not editing or managing", () => {
  const shared = { ...document, permission: "read" };
  assert.equal(canReadDocument(shared, reader), true);
  assert.equal(canEditDocument(shared, reader), false);
  assert.equal(canManageDocument(shared, reader), false);
});

test("edit permission allows reading and editing but not sharing or deleting", () => {
  const shared = { ...document, permission: "edit" };
  assert.equal(canReadDocument(shared, editor), true);
  assert.equal(canEditDocument(shared, editor), true);
  assert.equal(canManageDocument(shared, editor), false);
});

test("admin can read, edit, and manage any document", () => {
  assert.equal(canReadDocument(document, admin), true);
  assert.equal(canEditDocument(document, admin), true);
  assert.equal(canManageDocument(document, admin), true);
});

test("missing document or user is always denied", () => {
  assert.equal(canReadDocument(null, owner), false);
  assert.equal(canEditDocument(document, null), false);
  assert.equal(canManageDocument(null, admin), false);
});
