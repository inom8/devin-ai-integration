import { useState } from "react";

interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Oil Change" },
  { id: "2", name: "Diagnostics" },
  { id: "3", name: "Maintenance" },
  { id: "4", name: "Tire Repair" },
  { id: "5", name: "Car Wash" },
  { id: "6", name: "Battery Service" },
  { id: "7", name: "Brake Repair" },
  { id: "8", name: "AC Service" },
];

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories([...categories, { id: Date.now().toString(), name: newName.trim() }]);
    setNewName("");
  };

  const handleRemove = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Categories Management</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="New category name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            flex: 1,
            maxWidth: 320,
            fontSize: 14,
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#1a73e8",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Add Category
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 500 }}>{cat.name}</span>
            <button
              onClick={() => handleRemove(cat.id)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
