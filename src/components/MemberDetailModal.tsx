import React, { useEffect, useState } from 'react';
import { api, downloadFile, errorMessage, mediaUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from './Toast';
import { Avatar, ConfirmDialog, ErrorState, Modal, Spinner, StatusBadge, formatDate } from './ui';

interface Role {
  id: number;
  name: string;
}

const STATUS_ACTIONS: Array<{ status: string; label: string; icon: string; className: string; from: string[] }> = [
  { status: 'APPROVED', label: 'Approve', icon: 'bi-check-lg', className: 'btn-success', from: ['PENDING', 'REJECTED', 'SUSPENDED'] },
  { status: 'REJECTED', label: 'Reject', icon: 'bi-x-lg', className: 'btn-outline-danger', from: ['PENDING'] },
  { status: 'SUSPENDED', label: 'Suspend', icon: 'bi-slash-circle', className: 'btn-outline-danger', from: ['APPROVED'] },
];

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-row">
    <span>{label}</span>
    <strong>{value || '—'}</strong>
  </div>
);

export const MemberDetailModal: React.FC<{ memberId: number; roles: Role[]; onClose: () => void; onChanged: () => void }> = ({
  memberId,
  roles,
  onClose,
  onChanged,
}) => {
  const { isContentAdmin, isSuperAdmin, user } = useAuth();
  const toast = useToast();
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ status: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [roleId, setRoleId] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    setError(null);
    api
      .get(`/members/${memberId}`)
      .then((res) => {
        setMember(res.data.data);
        setRoleId(res.data.data.role_id);
      })
      .catch((err) => setError(errorMessage(err)));
  };
  useEffect(load, [memberId]);

  const changeStatus = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await api.patch(`/members/${memberId}/status`, { status: pending.status });
      setMember(res.data.data);
      toast(res.data.message);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const saveRole = async () => {
    setBusy(true);
    try {
      const res = await api.patch(`/members/${memberId}/role`, { role_id: roleId });
      setMember(res.data.data);
      toast(res.data.message);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const downloadCard = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/members/${memberId}/id-card`, `ID_Card_${member.member_id}.pdf`);
    } catch (err) {
      toast(errorMessage(err, 'Could not download ID card'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const assignableRoles = (roles || []).filter((r) => isSuperAdmin || !['Admin', 'Super Admin'].includes(r.name));
  const isSelf = member?.user_id === user?.id;

  return (
    <Modal
      title="Member details"
      onClose={onClose}
      size="lg"
      footer={
        member && (
          <>
            <button className="btn btn-outline-secondary me-auto" onClick={downloadCard} disabled={downloading}>
              {downloading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-file-earmark-pdf me-1"></i>}
              Download ID card
            </button>
            {!isSelf &&
              STATUS_ACTIONS.filter((a) => a.from.includes(member.status)).map((a) => (
                <button key={a.status} className={`btn ${a.className}`} onClick={() => setPending({ status: a.status, label: a.label })}>
                  <i className={`bi ${a.icon} me-1`}></i>
                  {a.label}
                </button>
              ))}
          </>
        )
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !member ? (
        <Spinner />
      ) : (
        <>
          <div className="member-hero">
            <Avatar src={mediaUrl(member.profile_image)} name={member.full_name} size={72} />
            <div>
              <h4 className="mb-1">{member.full_name}</h4>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="code-pill">{member.member_id}</span>
                <StatusBadge status={member.status} />
                <span className="text-muted small">{member.role_name}</span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <h6 className="detail-heading">Personal</h6>
              <Row label="Father's name" value={member.father_name} />
              <Row label="Date of birth" value={formatDate(member.date_of_birth)} />
              <Row label="Gender" value={member.gender} />
              <Row label="Blood group" value={member.blood_group !== 'Unknown' ? member.blood_group : null} />
              <Row label="Phone" value={`${member.country_code} ${member.phone_number}`} />
              <Row label="Email" value={member.email} />
              <Row label="Aadhaar" value={member.aadhaar_masked} />
              <Row label="Voter ID" value={member.voter_id_masked} />
            </div>
            <div className="col-md-6">
              <h6 className="detail-heading">Location</h6>
              <Row label="Parliament" value={member.parliament_name} />
              <Row label="Assembly" value={member.assembly_name} />
              <Row label="District" value={member.district_name} />
              <Row label="Taluk / Block" value={member.block_name} />
              <Row label="Village" value={member.village_name || member.village_custom} />
              <Row label="Address" value={member.address_line1} />
              <Row label="Registered" value={formatDate(member.created_at, true)} />
            </div>
          </div>

          {isContentAdmin && !isSelf && (
            <div className="role-editor">
              <label className="form-label mb-1" htmlFor="role-select">Role & system access</label>
              <div className="d-flex gap-2">
                <select id="role-select" className="form-select" value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button className="btn btn-brand text-nowrap" onClick={saveRole} disabled={busy || roleId === member.role_id}>
                  Save role
                </button>
              </div>
              <div className="form-text">Coordinator roles can view members in their own district / block. Admin roles can manage everything.</div>
            </div>
          )}
        </>
      )}

      {pending && (
        <ConfirmDialog
          title={`${pending.label} member?`}
          message={
            <>
              <strong>{member?.full_name}</strong> will be marked as <strong>{pending.status}</strong>.
              {pending.status === 'SUSPENDED' && ' They will not be able to log in until re-approved.'}
            </>
          }
          confirmLabel={pending.label}
          danger={pending.status !== 'APPROVED'}
          busy={busy}
          onConfirm={changeStatus}
          onCancel={() => setPending(null)}
        />
      )}
    </Modal>
  );
};
