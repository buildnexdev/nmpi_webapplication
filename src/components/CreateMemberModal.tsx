import React, { useEffect, useRef, useState } from 'react';
import { api, asArray, errorMessage } from '../api/client';
import { useToast } from './Toast';
import { Field, Modal, Spinner } from './ui';

interface Option {
  id: number;
  name_en?: string;
  name_ta?: string;
  name?: string;
  code?: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];

export const CreateMemberModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parliaments, setParliaments] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [villages, setVillages] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);

  const [form, setForm] = useState({
    full_name: '',
    father_name: '',
    date_of_birth: '',
    gender: 'MALE',
    blood_group: 'Unknown',
    phone_number: '',
    email: '',
    password: 'password123',
    aadhaar_number: '',
    voter_id: '',
    parliament_constituency_id: '',
    district_id: '',
    block_id: '',
    village_id: '',
    village_custom: '',
    address_line1: '',
    designation: '',
    role_id: '1',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/master-data/parliaments'),
      api.get('/master-data/districts'),
      api.get('/master-data/roles/all'),
    ])
      .then(([pRes, dRes, rRes]) => {
        setParliaments(asArray(pRes.data.data));
        setDistricts(asArray(dRes.data.data));
        setRoles(asArray(rRes.data.data));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoadingMaster(false));
  }, []);

  useEffect(() => {
    if (!form.district_id) {
      setBlocks([]);
      setForm((f) => ({ ...f, block_id: '', village_id: '' }));
      return;
    }
    api
      .get(`/master-data/blocks?district_id=${form.district_id}`)
      .then((r) => setBlocks(asArray(r.data.data)))
      .catch(() => setBlocks([]));
  }, [form.district_id]);

  useEffect(() => {
    if (!form.block_id) {
      setVillages([]);
      setForm((f) => ({ ...f, village_id: '' }));
      return;
    }
    api
      .get(`/master-data/villages?block_id=${form.block_id}`)
      .then((r) => setVillages(asArray(r.data.data)))
      .catch(() => setVillages([]));
  }, [form.block_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      setError('Please select a profile photo for the ID card.');
      return;
    }
    if (!form.full_name.trim() || !form.father_name.trim()) {
      setError('Full name and father name are required.');
      return;
    }
    if (!form.date_of_birth) {
      setError('Date of birth is required.');
      return;
    }
    if (!form.phone_number.trim() || form.phone_number.replace(/\D/g, '').length < 10) {
      setError('Valid 10-digit phone number is required.');
      return;
    }
    if (!form.aadhaar_number.replace(/\D/g, '') || form.aadhaar_number.replace(/\D/g, '').length !== 12) {
      setError('Valid 12-digit Aadhaar number is required.');
      return;
    }
    if (!form.voter_id.trim()) {
      setError('Voter ID is required.');
      return;
    }
    if (!form.parliament_constituency_id || !form.district_id || !form.block_id) {
      setError('Please select parliament, district, and taluk/block.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          data.append(k, String(v).trim());
        }
      });
      data.append('country_code', '+91');
      data.append('profile_image', photoFile);

      const res = await api.post('/members/register', data);
      toast(res.data?.message || 'Member created and ID card generated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(errorMessage(err, 'Failed to create member.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add New Member" onClose={onClose} size="lg">
      {loadingMaster ? (
        <Spinner label="Loading master data..." />
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>{error}</div>
            </div>
          )}

          <div className="row g-3">
            {/* Photo Upload with S3 preview */}
            <div className="col-12 text-center pb-2">
              <div className="d-inline-flex flex-column align-items-center">
                <div
                  className="rounded-circle border border-2 border-primary d-flex align-items-center justify-content-center overflow-hidden mb-2"
                  style={{ width: 100, height: 100, backgroundColor: '#f8f9fa', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload profile photo"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="text-muted text-center p-2">
                      <i className="bi bi-camera-fill fs-3 d-block"></i>
                      <span className="small">Add Photo *</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-upload me-1"></i>Choose Photo (Stored to S3)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="col-md-6">
              <Field label="Full Name" required>
                <input
                  className="form-control"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Father's / Husband's Name" required>
                <input
                  className="form-control"
                  name="father_name"
                  value={form.father_name}
                  onChange={handleChange}
                  placeholder="e.g. Murugan"
                  required
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Date of Birth" required>
                <input
                  type="date"
                  className="form-control"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Gender" required>
                <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Blood Group">
                <select className="form-select" name="blood_group" value={form.blood_group} onChange={handleChange}>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Contact Details */}
            <div className="col-md-4">
              <Field label="Mobile Number" required>
                <input
                  type="tel"
                  className="form-control"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Email Address" required>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Password" required hint="Initial login password">
                <input
                  type="text"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>

            {/* Identity Details */}
            <div className="col-md-6">
              <Field label="Aadhaar Number" required>
                <input
                  className="form-control"
                  name="aadhaar_number"
                  value={form.aadhaar_number}
                  onChange={handleChange}
                  placeholder="12 digits"
                  maxLength={12}
                  required
                />
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Voter ID" required>
                <input
                  className="form-control"
                  name="voter_id"
                  value={form.voter_id}
                  onChange={handleChange}
                  placeholder="e.g. ABC1234567"
                  required
                />
              </Field>
            </div>

            {/* Padhavi (Designation) & Role */}
            <div className="col-md-6">
              <Field label="பதவி / Designation (Padhavi)" hint="Shown on ID card & District Administrators">
                <input
                  className="form-control"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. மாவட்ட செயலாளர் / Youth Wing Leader"
                />
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Role & Access" required>
                <select className="form-select" name="role_id" value={form.role_id} onChange={handleChange}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Location Hierarchy */}
            <div className="col-md-4">
              <Field label="Parliament Constituency" required>
                <select
                  className="form-select"
                  name="parliament_constituency_id"
                  value={form.parliament_constituency_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Parliament</option>
                  {parliaments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_en} {p.name_ta ? `(${p.name_ta})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="District" required>
                <select
                  className="form-select"
                  name="district_id"
                  value={form.district_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_en} {d.name_ta ? `(${d.name_ta})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Taluk / Block" required>
                <select
                  className="form-select"
                  name="block_id"
                  value={form.block_id}
                  onChange={handleChange}
                  disabled={!form.district_id}
                  required
                >
                  <option value="">Select Taluk / Block</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name_en} {b.name_ta ? `(${b.name_ta})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Village / Ward">
                {villages.length > 0 ? (
                  <select
                    className="form-select"
                    name="village_id"
                    value={form.village_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Village (or type below)</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name_en} {v.name_ta ? `(${v.name_ta})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-control"
                    name="village_custom"
                    value={form.village_custom}
                    onChange={handleChange}
                    placeholder="Enter village / area name"
                  />
                )}
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Residential Address">
                <input
                  className="form-control"
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  placeholder="Street / Door No."
                />
              </Field>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-brand" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving Member & Uploading to S3...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Create Member
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
