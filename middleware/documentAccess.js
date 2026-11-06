function canReadDocument(document, user) {
  return Boolean(document && user && (
    user.role === "admin" ||
    Number(document.owner_id) === Number(user.id) ||
    document.permission === "read" ||
    document.permission === "edit" ||
    document.permission === "owner"
  ));
}

function canEditDocument(document, user) {
  if (!document || !user || user.role === "viewer") return false;
  return user.role === "admin" ||
    Number(document.owner_id) === Number(user.id) ||
    document.permission === "edit" ||
    document.permission === "owner";
}

function canManageDocument(document, user) {
  if (!document || !user || user.role === "viewer") return false;
  return user.role === "admin" ||
    Number(document.owner_id) === Number(user.id) ||
    document.permission === "owner";
}

module.exports = { canReadDocument, canEditDocument, canManageDocument };
