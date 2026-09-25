import { Edit3, Plus, ShieldCheck, Trash2, UserRound, X, Check } from 'lucide-react';
import { useState } from 'react';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';

const emptyForm = { name: '', role: 'Staff', phone: '', email: '', active: true, permissions: { orders: true, pricing: false, settings: false, reports: false, inventory: true, staff: false } };
const permissionLabels = { orders: 'Orders & print queue', pricing: 'Pricing', settings: 'Shop settings', reports: 'Reports', inventory: 'Inventory', staff: 'Staff management' };

export default function OwnerStaffPage() {
  const { staff, addStaff, updateStaff, removeStaff, toggleStaffActive } = useOrder();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (person) => { setEditing(person.id); setForm({ ...person, permissions: { ...emptyForm.permissions, ...(person.permissions || {}) } }); };
  const close = () => { setEditing(null); setForm(emptyForm); };
  const setPermission = (key) => setForm(current => ({ ...current, permissions: { ...current.permissions, [key]: !current.permissions[key] } }));
  const save = () => {
    if (!form.name.trim()) return;
    if (editing === 'new') addStaff(form);
    else updateStaff(editing, form);
    close();
  };

  return (
    <OwnerShell title="Staff">
      <div className="pricing-intro">
        <div><span className="owner-eyebrow">TEAM ACCESS</span><h2>People who can operate the shop</h2><p>Add staff, edit their details, control permissions, or deactivate access.</p></div>
        <button className="owner-primary-button" onClick={openNew}><Plus size={17}/> Add staff</button>
      </div>

      <div className="staff-list">
        {staff.map(person => (
          <article className="staff-card" key={person.id}>
            <div className="staff-avatar"><UserRound size={19}/></div>
            <div className="staff-person-copy"><strong>{person.name}</strong><span>{person.role} · {person.phone || 'No phone added'}</span><small>{person.email || 'No email added'}</small></div>
            <div className={`staff-status ${person.active ? '' : 'inactive'}`}><ShieldCheck size={16}/>{person.active ? 'Active' : 'Inactive'}</div>
            <div className="staff-actions">
              <button className="table-icon-button" onClick={() => openEdit(person)} aria-label={`Edit ${person.name}`} title="Edit"><Edit3 size={16}/></button>
              {person.role !== 'Owner' && <button className="table-icon-button staff-delete" onClick={() => removeStaff(person.id)} aria-label={`Remove ${person.name}`} title="Remove"><Trash2 size={16}/></button>}
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <div className="modal-backdrop" onMouseDown={close}>
          <section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-modal-title" onMouseDown={e => e.stopPropagation()}>
            <div className="staff-modal-head"><div><span className="owner-eyebrow">TEAM MEMBER</span><h2 id="staff-modal-title">{editing === 'new' ? 'Add staff member' : 'Edit staff member'}</h2></div><button className="table-icon-button" onClick={close} aria-label="Close"><X size={18}/></button></div>
            <div className="staff-form-grid">
              <label><span>Name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Das" autoFocus /></label>
              <label><span>Role</span><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} disabled={form.role === 'Owner'}><option>Staff</option><option>Manager</option><option>Owner</option></select></label>
              <label><span>Phone</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></label>
              <label><span>Email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@shop.local" /></label>
            </div>
            <div className="staff-access-head"><div><strong>Permissions</strong><small>Choose what this person can manage.</small></div><button className={`toggle ${form.active ? 'on' : ''}`} onClick={() => setForm({ ...form, active: !form.active })} aria-label="Toggle active status"><span /></button></div>
            <div className="staff-permissions">
              {Object.entries(permissionLabels).map(([key, label]) => <button key={key} className={`staff-permission ${form.permissions[key] ? 'active' : ''}`} onClick={() => setPermission(key)}><span>{form.permissions[key] ? <Check size={14}/> : null}</span>{label}</button>)}
            </div>
            <div className="staff-modal-actions"><button className="owner-secondary-button" onClick={close}>Cancel</button><button className="owner-primary-button" onClick={save}>{editing === 'new' ? 'Add staff' : 'Save changes'}</button></div>
          </section>
        </div>
      )}
    </OwnerShell>
  );
}
