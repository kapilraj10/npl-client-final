import React, { useEffect, useMemo, useState } from "react";
import { MatchesAPI } from "../service/api";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // match or null
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await MatchesAPI.list();
        setItems(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const f = filter.toLowerCase();
    return items.filter((m) =>
      [m.venue, m.streamUrl, m.status, m?.teams?.[0]?.name, m?.teams?.[1]?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(f))
    );
  }, [items, filter]);

  const startCreate = () =>
    setEditing({
      date: "",
      startTime: "",
      teams: [
        { name: "", short: "", color: "#0B4F6C" },
        { name: "", short: "", color: "#D90429" },
      ],
      venue: "",
      streamUrl: "",
      status: "scheduled",
    });

  const startEdit = (m) => setEditing(JSON.parse(JSON.stringify(m)));

  const save = async () => {
    // basic validation
    if (!editing.date || !editing.startTime || !editing.teams?.[0]?.name || !editing.teams?.[1]?.name) {
      alert("Please fill date, time and both team names.");
      return;
    }
    try {
      if (editing._id) {
        const updated = await MatchesAPI.update(editing._id, editing);
        setItems((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      } else {
        const created = await MatchesAPI.create(editing);
        setItems((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (e) {
      alert(e.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this match?")) return;
    try {
      await MatchesAPI.remove(id);
      setItems((prev) => prev.filter((m) => m._id !== id));
    } catch (e) {
      alert(e.message || 'Failed to delete');
    }
  };

  return (
    <section className="relative isolate bg-white text-gray-900 min-h-[60vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-gray-600 mt-1 text-sm">Create and manage Upcoming fixtures.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by team / venue / status"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
            />
            <button
              type="button"
              onClick={startCreate}
              className="rounded-md bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-red-600 hover:to-rose-600"
            >
              + New Match
            </button>
          </div>
        </header>

        {/* List */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Teams</th>
                <th className="px-4 py-2">Venue</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                    No matches. Click "New Match" to create.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                    <tr key={m._id} className="border-b border-gray-200">
                    <td className="px-4 py-2">{m.date}</td>
                    <td className="px-4 py-2">{m.startTime}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium">{m?.teams?.[0]?.short || m?.teams?.[0]?.name}</span>
                      <span className="mx-1 text-gray-400">vs</span>
                      <span className="font-medium">{m?.teams?.[1]?.short || m?.teams?.[1]?.name}</span>
                    </td>
                    <td className="px-4 py-2">{m.venue}</td>
                    <td className="px-4 py-2 capitalize">{m.status || "scheduled"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(m)} className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50">Edit</button>
                        <button onClick={() => remove(m._id)} className="rounded-md border border-rose-300 px-3 py-1 text-rose-600 hover:bg-rose-50">Delete</button>
                        <SetLiveButton id={m._id} active={m.status === 'live'} onDone={(updated)=> setItems((prev)=> prev.map(x=> x._id===updated._id? updated : (x.status==='live'? {...x, status:'scheduled'}: x)))} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editing && <Editor match={editing} setMatch={setEditing} onSave={save} onClose={() => setEditing(null)} />}
      </div>
    </section>
  );
}

function Editor({ match, setMatch, onSave, onClose }) {
  const set = (path, value) => {
    const next = { ...match };
    const segs = Array.isArray(path) ? path : String(path).split(".");
    let cur = next;
    for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]];
    cur[segs.at(-1)] = value;
    setMatch(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto">
      <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{match?._id ? "Edit Match" : "New Match"}</h2>
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input type="date" value={match.date} onChange={(e) => set("date", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
          </Field>
          <Field label="Start Time">
            <input type="time" value={match.startTime} onChange={(e) => set("startTime", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
          </Field>
          <Field label="Venue">
            <input value={match.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Stadium" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
          </Field>
          <Field label="Stream URL (optional)">
            <input value={match.streamUrl} onChange={(e) => set("streamUrl", e.target.value)} placeholder="https://..." className="w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
          </Field>
          <Field label="Status">
            <select value={match.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2">
              <option value="scheduled">Scheduled</option>
              <option value="soon">Starting Soon</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TeamEditor title="Team A" team={match.teams[0]} setTeam={(t) => set(["teams", 0], t)} />
          <TeamEditor title="Team B" team={match.teams[1]} setTeam={(t) => set(["teams", 1], t)} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-white/20 px-4 py-2 hover:bg-white/10">Cancel</button>
          <button onClick={onSave} className="rounded-md bg-linear-to-r from-[#D90429] to-rose-600 px-5 py-2 font-semibold text-white hover:from-rose-600 hover:to-[#D90429]">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function TeamEditor({ title, team, setTeam }) {
  const set = (k, v) => setTeam({ ...team, [k]: v });
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="mb-2 text-sm font-semibold text-gray-700">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input value={team.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" className="rounded-md border border-gray-300 bg-white px-3 py-2" />
        <input value={team.short} onChange={(e) => set("short", e.target.value)} placeholder="Short" className="rounded-md border border-gray-300 bg-white px-3 py-2" />
        <input value={team.color} onChange={(e) => set("color", e.target.value)} placeholder="#D90429" className="rounded-md border border-gray-300 bg-white px-3 py-2" />
      </div>
    </div>
  );
}

function SetLiveButton({ id, active, onDone }) {
  const [loading, setLoading] = React.useState(false);
  const click = async () => {
    if (active) return;
    setLoading(true);
    try {
      const upd = await MatchesAPI.setLive(id);
      onDone && onDone(upd);
    } catch {
      alert('Failed to set live');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button onClick={click} disabled={active || loading} className={`rounded-md px-3 py-1 ${active? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-not-allowed' : 'border border-gray-300 hover:bg-gray-50'}`}>
      {active? 'Live' : (loading? 'Setting...' : 'Set Live')}
    </button>
  );
}
