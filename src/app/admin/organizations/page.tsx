"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Org {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended";
}

export default function AdminOrganizationsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/organizations", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load organizations");
        const data: Org[] = await res.json();
        if (!cancelled) setOrgs(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setHasError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createOrg() {
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) throw new Error("Failed to create organization");
      const org = await res.json();
      setOrgs((prev) => [org, ...prev]);
      setName("");
      setSlug("");
    } catch {
      alert("Error creating organization");
    }
  }

  async function toggleStatus(id: string, status: "active" | "suspended") {
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "active" ? "suspended" : "active",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      alert("Error updating organization");
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Forbidden</h2>
          <p className="text-gray-600 mb-6">
            You do not have admin permissions.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Organizations
          </h1>
          <p className="text-gray-600">Manage school clubs and organizations</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create Organization
          </h3>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="flex-1 border rounded px-3 py-2"
            />
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug"
              className="w-64 border rounded px-3 py-2"
            />
            <button
              onClick={createOrg}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
            >
              Create
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading organizations...
                  </td>
                </tr>
              ) : hasError ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-red-600"
                  >
                    {hasError}
                  </td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No organizations
                  </td>
                </tr>
              ) : (
                orgs.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {o.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {o.slug}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {o.status}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => toggleStatus(o.id, o.status)}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        {o.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
