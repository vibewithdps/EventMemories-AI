import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Calendar, Plus, Upload, Image, Film, Users, ShieldCheck, 
  Trash2, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Tag, 
  Layers, MapPin, Eye, EyeOff, Check, X, Clock, Compass
} from 'lucide-react';

const SAMPLE_WEDDING_FORM = {
  title: "The Royal Wedding Celebration",
  couple_names: "Aarav & Meera",
  event_date: "2026-11-20T17:00",
  venue_city: "Udaipur, Rajasthan",
  venue_name: "The Grand Palace & Lake Pavilions",
  venue_map_url: "https://maps.google.com/?q=Udaipur+Palace",
  story: "Welcome to our wedding celebration! We are delighted to share these joyous moments with all our beloved family and friends.",
  schedules: [],
};

const DEFAULT_EVENT_FORM = {
  title: '',
  couple_names: '',
  event_date: '2026-11-20T17:00',
  venue_city: '',
  venue_name: '',
  venue_map_url: '',
  story: '',
  schedules: [],
};

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'upload' | 'media' | 'clusters' | 'users' | 'settings'
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState(DEFAULT_EVENT_FORM);

  // Upload State
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventTag, setEventTag] = useState('General Highlights');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLogs, setUploadLogs] = useState([]);
  const fileInputRef = useRef(null);

  // Cluster Tagging State
  const [taggingClusterId, setTaggingClusterId] = useState(null);
  const [newClusterLabel, setNewClusterLabel] = useState('');

  // Privacy Purge State
  const [purgeMessage, setPurgeMessage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes, mediaRes, clustersRes, usersRes] = await Promise.all([
        axios.get('/api/admin/events'),
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/media'),
        axios.get('/api/admin/clusters'),
        axios.get('/api/admin/users'),
      ]);
      setEvents(eventsRes.data.events || []);
      setStats(statsRes.data);
      setMediaList(mediaRes.data.media || []);
      setClusters(clustersRes.data.clusters || []);
      setUsersList(usersRes.data.users || []);

      const active = (eventsRes.data.events || []).find((e) => e.is_active);
      if (active) setSelectedEventId(active.id);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Save new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/events', eventForm);
      setShowEventModal(false);
      setEventForm(DEFAULT_EVENT_FORM);
      await fetchDashboardData();
      alert(`Event '${eventForm.title}' published successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to create event: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Activate event
  const handleActivateEvent = async (eventId) => {
    try {
      await axios.post(`/api/admin/events/${eventId}/activate`);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to activate event.');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(`Delete event #${eventId} and its associated media?`)) return;
    try {
      await axios.delete(`/api/admin/events/${eventId}`);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete event.');
    }
  };

  // Bulk Upload Handler
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleStartUpload = async () => {
    if (!uploadFiles.length) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadLogs([]);

    const formData = new FormData();
    uploadFiles.forEach((file) => formData.append('files', file));
    formData.append('event_tag', eventTag);
    if (selectedEventId) {
      formData.append('event_id', selectedEventId);
    }

    try {
      setUploadProgress(40);
      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(85, percent));
        }
      });

      setUploadProgress(100);
      setUploadLogs(res.data.items || []);
      setUploadFiles([]);
      await fetchDashboardData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm(`Delete media #${mediaId}?`)) return;
    try {
      await axios.delete(`/api/admin/media/${mediaId}`);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete media.');
    }
  };

  // Tag Face Cluster
  const handleSaveClusterTag = async (clusterId) => {
    if (!newClusterLabel.trim()) return;
    try {
      await axios.post('/api/admin/clusters/tag', {
        cluster_id: clusterId,
        label: newClusterLabel.trim()
      });
      setTaggingClusterId(null);
      setNewClusterLabel('');
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to tag cluster.');
    }
  };

  // Purge Biometrics
  const handlePurgeAllBiometrics = async () => {
    if (!window.confirm('CAUTION: Are you sure you want to purge all guest facial embeddings?')) return;
    try {
      const res = await axios.post('/api/admin/purge-biometrics');
      setPurgeMessage(res.data.message);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to purge biometrics.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gold-300/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin: thakurdps795@gmail.com</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark-900 dark:text-zinc-100 mt-1">
            Event Management &amp; Face Studio
          </h1>
        </div>

        <div className="flex items-center space-x-3 self-start">
          <button
            onClick={() => setShowEventModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 hover:from-amber-700 text-white text-xs font-bold shadow-gold-glow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Events Active</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{stats.total_events || 0}</p>
            <span className="text-[10px] text-zinc-400">
              {stats.active_event ? stats.active_event.couple_names : 'None Active'}
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Total Media</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{stats.total_media}</p>
            <span className="text-[10px] text-zinc-400">{stats.total_photos} photos • {stats.total_videos} videos</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Faces Indexed</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{stats.total_faces}</p>
            <span className="text-[10px] text-zinc-400">128-d deep vectors</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Face Clusters</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{clusters.length}</p>
            <span className="text-[10px] text-zinc-400">Unique guest identities</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Registered Guests</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{stats.total_guests}</p>
            <span className="text-[10px] text-zinc-400">{stats.scanned_guests} scanned</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-gold-300/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold-600">Storage Used</span>
            <p className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">{stats.total_storage_mb} MB</p>
            <span className="text-[10px] text-zinc-400">Clean Database</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'events'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Wedding Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Bulk Upload Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'media'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Media Pool ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clusters')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'clusters'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Face Clusters ({clusters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'users'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Guests ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Data Purge</span>
        </button>
      </div>

      {/* TAB 1: EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold">Configured Events</h3>
              <p className="text-xs text-zinc-500">
                Create and manage events with custom date, venue, photos, and face-recognition galleries.
              </p>
            </div>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card border-2 border-dashed border-gold-400/50 text-center space-y-4 max-w-lg mx-auto">
              <Calendar className="w-12 h-12 text-gold-500 mx-auto" />
              <h4 className="font-serif text-xl font-bold">No Event Published Yet</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                All dummy data has been removed. Click below to add an event and publish it to the live platform!
              </p>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-gold-500 text-white text-xs font-bold shadow-gold-glow inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Event Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-6 rounded-3xl glass-card border relative space-y-4 ${
                    ev.is_active
                      ? 'border-gold-400 shadow-gold-glow/20 ring-2 ring-gold-400/50'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-serif text-xl font-bold text-dark-900 dark:text-zinc-100">
                          {ev.couple_names}
                        </h4>
                        {ev.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Active on Home Page
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gold-600 dark:text-gold-400 font-medium mt-0.5">
                        {ev.title}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gold-500" />
                      <span>{ev.event_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gold-500" />
                      <span>{ev.venue_name}, {ev.venue_city}</span>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                      {ev.description}
                    </p>
                  )}

                  {/* Sub-schedules summary */}
                  {ev.schedules?.length > 0 && (
                    <div className="space-y-1.5 bg-gold-50/50 dark:bg-dark-900/60 p-3 rounded-xl border border-gold-200/40 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">
                        {ev.schedules.length} Traditional Indian Rituals Included:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ev.schedules.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-dark-800 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700"
                          >
                            {s.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400">
                      {ev.media_count || 0} photos linked
                    </span>
                    {!ev.is_active && (
                      <button
                        onClick={() => handleActivateEvent(ev.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK UPLOAD WITH INDIAN FUNCTION TAGS */}
      {activeTab === 'upload' && (
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-3xl border border-gold-300/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-dark-900 dark:text-zinc-100">
                  Bulk Photo &amp; Video Uploader
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select ritual tag and upload media. Faces will be detected and indexed for guest matching.
                </p>
              </div>

              {/* Ritual Tag Selector with all Indian functions */}
              <div className="flex flex-wrap items-center gap-3">
                {events.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold">Event:</span>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-dark-800"
                    >
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.couple_names} {e.is_active ? '(Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold">Function / Ritual:</span>
                  <select
                    value={eventTag}
                    onChange={(e) => setEventTag(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-dark-800"
                  >
                    <option value="Roka / Sagai">Roka / Sagai / Engagement</option>
                    <option value="Haldi / Pithi">Haldi / Pithi / Gaye Holud</option>
                    <option value="Mehendi">Mehendi Ceremony</option>
                    <option value="Sangeet & Dance">Sangeet &amp; Dance Night</option>
                    <option value="Garba & Dandiya">Garba &amp; Dandiya Raas</option>
                    <option value="Baraat & Milni">Baraat &amp; Milni Procession</option>
                    <option value="Varmala">Varmala / Jaimala Ceremony</option>
                    <option value="Mandap & Saat Phere">Mandap, Saat Phere &amp; Muhurtham</option>
                    <option value="Kanyadaan & Thali Kettu">Kanyadaan &amp; Mangalya Dharanam</option>
                    <option value="Sindoor Daan">Sindoor Daan &amp; Mangalsutra</option>
                    <option value="Bidaai">Emotional Bidaai</option>
                    <option value="Griha Pravesh">Griha Pravesh &amp; Post-Wedding Games</option>
                    <option value="Grand Reception">Grand Reception Banquet</option>
                    <option value="Family Portraits">Family &amp; Candid Moments</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gold-400/60 hover:border-gold-500 rounded-3xl p-12 text-center cursor-pointer bg-gold-50/20 dark:bg-dark-900/40 hover:bg-gold-50/40 transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-gold-100 dark:bg-gold-900/50 flex items-center justify-center text-gold-600 mx-auto shadow-gold-glow">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-semibold text-sm text-dark-900 dark:text-zinc-100">
                Drag and drop your wedding photos &amp; videos here, or click to browse
              </p>
              <p className="text-xs text-zinc-400">
                Auto-indexed with YuNet Deep Face Detection &amp; SFace 128-d vectors
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {uploadFiles.length} file(s) selected
                  </span>
                  <button
                    onClick={() => setUploadFiles([])}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Clear Queue
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 text-xs">
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="py-1.5 px-2 flex items-center justify-between">
                      <span className="truncate max-w-sm">{file.name}</span>
                      <span className="text-zinc-400">{Math.round(file.size / 1024)} KB</span>
                    </div>
                  ))}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-zinc-200 dark:bg-dark-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-gold-500 to-amber-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gold-600 font-medium text-center">
                      Extracting 128-d vectors... {uploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  onClick={handleStartUpload}
                  disabled={isUploading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 hover:from-gold-600 text-white font-semibold text-sm shadow-gold-glow flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isUploading ? 'Processing...' : `Process & Index ${uploadFiles.length} Media Files`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEDIA POOL */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <h3 className="font-serif text-xl font-bold">Uploaded Media Pool</h3>
          {mediaList.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Image className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">No media uploaded yet</p>
              <p className="text-xs text-zinc-500 mt-1">Upload event photos using the Bulk Upload tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {mediaList.map((media) => (
                <div key={media.id} className="group relative rounded-2xl overflow-hidden aspect-square shadow-md bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <img src={media.thumbnail_url} alt={media.original_name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-gold-300 text-[11px] font-bold">
                    {media.faces_count} Faces
                  </div>
                  <button
                    onClick={() => handleDeleteMedia(media.id)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-700 transition-all shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-white text-xs">
                    <p className="truncate font-medium">{media.original_name}</p>
                    <span className="text-[10px] text-gold-400">{media.event_tag}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLUSTERS */}
      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <h3 className="font-serif text-xl font-bold">Face Clusters</h3>
          {clusters.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Layers className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">No face clusters yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {clusters.map((cluster) => (
                <div key={cluster.cluster_id} className="glass-card p-5 rounded-3xl border border-gold-300/30 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold-400/60 bg-zinc-900 shrink-0">
                      <img src={cluster.sample_thumb_url} alt="Cluster Sample" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gold-600">Cluster #{cluster.cluster_id}</span>
                      <h4 className="font-serif text-lg font-bold">{cluster.label}</h4>
                      <p className="text-xs text-zinc-500">{cluster.size} photos linked</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GUESTS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h3 className="font-serif text-xl font-bold">Registered Guests</h3>
          <div className="glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-dark-800 text-zinc-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Guest Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Scan Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gold-50/20">
                    <td className="px-6 py-4 font-semibold">{u.full_name}</td>
                    <td className="px-6 py-4 text-zinc-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.has_scanned ? <span className="text-emerald-600 font-semibold">Scanned</span> : <span className="text-zinc-400">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-rose-300/60 dark:border-rose-900/40 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <ShieldCheck className="w-7 h-7" />
              <h3 className="font-serif text-xl font-bold">Post-Event Biometric Purge</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Purges all stored 128-d face coordinate vectors from all guest accounts for post-event privacy compliance.
            </p>

            {purgeMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs">
                {purgeMessage}
              </div>
            )}

            <button
              onClick={handlePurgeAllBiometrics}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Guest Facial Biometrics</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= CREATE EVENT MODAL WITH ALL INDIAN STATE TRADITIONS ================= */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-900 border border-gold-400/60 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-dark-900 dark:text-zinc-100">
                    Create Event
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Fill in the event details below to publish for your guests.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEventForm(SAMPLE_WEDDING_FORM)}
                    className="px-3 py-1.5 rounded-xl bg-gold-100 dark:bg-gold-950/60 text-gold-700 dark:text-gold-300 hover:bg-gold-200 dark:hover:bg-gold-900/60 text-xs font-semibold flex items-center space-x-1.5 border border-gold-300/60 transition-all"
                    title="1-Click Fill Real Wedding Details"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                    <span>Auto-Fill Example</span>
                  </button>
                  <button onClick={() => setShowEventModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Event Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Royal Wedding Celebration"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav & Meera"
                      value={eventForm.couple_names}
                      onChange={(e) => setEventForm({ ...eventForm, couple_names: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                      Venue City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Udaipur, Rajasthan"
                      value={eventForm.venue_city}
                      onChange={(e) => setEventForm({ ...eventForm, venue_city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Grand Palace & Lake Pavilions"
                    value={eventForm.venue_name}
                    onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    Welcome Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Welcome to our wedding celebration! We are delighted to share these joyous moments with all our beloved family and friends."
                    value={eventForm.story}
                    onChange={(e) => setEventForm({ ...eventForm, story: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs dark:bg-dark-800 focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-dark-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold-500 to-amber-600 text-white text-xs font-bold shadow-gold-glow hover:opacity-95 transition-all"
                  >
                    Publish Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
