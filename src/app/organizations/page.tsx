"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<UserOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/user/organizations", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load organizations");
        const data: UserOrg[] = await res.json();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Organizations</h1>
          <p className="text-gray-600">
            Manage clubs and book rooms on their behalf
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : hasError ? (
          <div className="text-center text-red-600">{hasError}</div>
        ) : orgs.length === 0 ? (
          <div className="text-center text-gray-600">
            You are not a member of any organizations yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orgs.map((o) => (
              <div key={o.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {o.name}
                    </h3>
                    <p className="text-sm text-gray-600">Role: {o.role}</p>
                  </div>
                  <Link
                    href="/book-room"
                    className="text-sm text-red-800 hover:underline"
                  >
                    Book a room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
