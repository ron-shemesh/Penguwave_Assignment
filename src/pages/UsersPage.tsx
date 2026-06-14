import { useState } from "react";
import type { User, UserRole } from "../types";
import { USER_ROLES } from "../types";
import { isAdmin } from "../utils";

// User management. Security fixes from the starter:
//  - Passwords are never modeled or displayed. The starter stored plaintext
//    passwords in state and rendered them in a "Password" column — secrets must
//    never reach the client. The User type no longer has a password field.
//  - Admin-only gate via isAdmin(). This hides the UI from non-admins, but it is
//    a convenience only: a client-side check secures nothing (you can flip the
//    role in devtools). Real authorization must be enforced by the backend
//    (Track A) — this gate is the front end honouring that contract, not
//    replacing it.
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: "1", email: "admin@penguwave.io", role: "admin", status: "active" },
    { id: "2", email: "analyst@penguwave.io", role: "analyst", status: "active" },
    { id: "3", email: "viewer@penguwave.io", role: "viewer", status: "disabled" },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("analyst");

  if (!isAdmin()) {
    return (
      <div className="page-container">
        <h1>User Management</h1>
        <div className="state-panel">
          <p>
            <strong>Access restricted.</strong> User management is available to administrators only.
          </p>
          <p style={{ color: "#93a3b8", marginTop: 8 }}>
            This page is gated on the client for convenience. In a real deployment the backend
            enforces this — the server rejects unauthorized requests regardless of what the UI shows.
          </p>
        </div>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    // No password handled here — credential setup happens server-side (the
    // backend issues an invite / reset flow). The client never sees secrets.
    const newUser: User = {
      id: crypto.randomUUID(),
      email: newEmail,
      role: newRole,
      status: "active",
    };

    setUsers([...users, newUser]);
    setNewEmail("");
    setNewRole("analyst");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="page-container">
      <div className="events-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <div className="user-form">
          <h3 style={{ marginBottom: 12 }}>New User</h3>
          <form onSubmit={handleAddUser}>
            <div style={{ marginBottom: 8 }}>
              <label>Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@penguwave.io"
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Create User
            </button>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <span style={{ color: user.status === "active" ? "#2e7d32" : "#999" }}>
                  {user.status}
                </span>
              </td>
              <td>
                <button className="link-button link-danger" onClick={() => handleDelete(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && <p style={{ color: "#999" }}>No users.</p>}
    </div>
  );
}
