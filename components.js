// =========================================================================
// ANTSGO ACADEMY - SHARED VUE 3 GLOBAL COMPONENTS
// =========================================================================

// 1. Sidebar Component
window.SidebarComponent = {
  props: {
    activePage: { type: String, required: true },
    sidebarMenu: { type: Array, required: true },
    roleText: { type: String, default: '' },
    avatarInitials: { type: String, default: '' }
  },
  emits: ['navigate', 'logout'],
  setup(props, { emit }) {
    const isSidebarOpen = Vue.ref(false);
    const expandedMenus = Vue.reactive({});

    // Toggle Mobile Sidebar Drawer
    const toggleSidebar = (state) => {
      isSidebarOpen.value = state;
    };

    // Toggle Collapsible Accordion Submenu
    const toggleSubmenu = (menuId) => {
      // Close other submenus to keep it clean
      Object.keys(expandedMenus).forEach(key => {
        if (key !== menuId) expandedMenus[key] = false;
      });
      expandedMenus[menuId] = !expandedMenus[menuId];
    };

    // Navigation trigger
    const navigateTo = (pageId, label, parentLabel = '') => {
      emit('navigate', { id: pageId, label, parentLabel });
      isSidebarOpen.value = false; // Close drawer on mobile
    };

    // Logout trigger
    const handleLogout = () => {
      emit('logout');
    };

    // Expose toggleSidebar for external calling (via ref)
    return {
      isSidebarOpen,
      expandedMenus,
      toggleSidebar,
      toggleSubmenu,
      navigateTo,
      handleLogout
    };
  },
  template: `
    <div>
      <!-- Backdrop for mobile -->
      <div class="sidebar-backdrop" :class="{ show: isSidebarOpen }" @click="toggleSidebar(false)"></div>

      <aside class="sidebar" :class="{ open: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="brand-logo" style="display: flex; gap: 10px; align-items: center;">
            <img src="logo.png" alt="Logo" style="height: 32px; filter: brightness(0) invert(1);">
            <span>AntsGo Academy</span>
          </div>
          <button class="menu-toggle-btn" @click="toggleSidebar(false)" style="color: white; font-size: 16px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="sidebar-menu">
          <div v-for="item in sidebarMenu" :key="item.id">
            <!-- Single Link Menu Item -->
            <a v-if="item.type === 'single'" 
               @click="navigateTo(item.id, item.label)" 
               class="menu-item" 
               :class="{ active: activePage === item.id }">
              <i class="fa-solid" :class="item.icon"></i> {{ item.label }}
            </a>

            <!-- Collapsible Submenu Item -->
            <div v-else-if="item.type === 'parent'">
              <div @click="toggleSubmenu(item.id)" 
                   class="menu-item menu-item-parent" 
                   :class="{ open: expandedMenus[item.id] }">
                <span><i class="fa-solid" :class="item.icon"></i> {{ item.label }}</span>
                <i class="fa-solid fa-chevron-right arrow-icon"></i>
              </div>
              <div class="submenu-container" :class="{ open: expandedMenus[item.id] }">
                <a v-for="child in item.children" 
                   :key="child.id" 
                   @click="navigateTo(child.id, child.label, item.label)" 
                   class="submenu-item" 
                   :class="{ active: activePage === child.id }">
                  {{ child.label }}
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <p>&copy; 2026 AntsGo Academy</p>
          <p style="font-size: 10px; margin-top: 4px;">Role: {{ roleText }}</p>
        </div>
      </aside>
    </div>
  `
};

// 2. Header Component
window.HeaderComponent = {
  props: {
    pageTitle: { type: String, required: true },
    systemDateString: { type: String, required: true },
    userName: { type: String, required: true },
    roleText: { type: String, required: true },
    avatarInitials: { type: String, default: '' }
  },
  emits: ['toggle-sidebar', 'navigate-settings', 'logout'],
  setup(props, { emit }) {
    const isDropdownOpen = Vue.ref(false);
    const triggerSidebar = () => {
      emit('toggle-sidebar');
    };
    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };
    const closeDropdown = () => {
      isDropdownOpen.value = false;
    };
    return { triggerSidebar, isDropdownOpen, toggleDropdown, closeDropdown };
  },
  template: `
    <header class="header-nav" style="position: relative;">
      <div class="header-left">
        <button class="menu-toggle-btn" @click="triggerSidebar">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="header-title-area">
          <h1>{{ pageTitle }}</h1>
          <p>{{ systemDateString }}</p>
        </div>
      </div>

      <div class="header-right" style="position: relative; display: flex; align-items: center; gap: 12px;">
        <!-- Profile info badge directly visible in navbar -->
        <div class="user-profile-badge" style="display: flex; gap: 8px; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 20px; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='transparent'" @click="toggleDropdown">
          <div class="user-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">
            {{ avatarInitials }}
          </div>
          <div class="user-info" style="display: flex; flex-direction: column; text-align: left; max-width: 100px; overflow: hidden;">
            <span class="user-name" style="font-weight: 700; font-size: 12.5px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ userName }}</span>
            <span class="user-role-tag" style="font-size: 9.5px; color: var(--text-muted); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ roleText }}</span>
          </div>
        </div>

        <div style="position: relative;">
          <!-- Settings Gear Dropdown Toggle -->
          <button class="nav-icon-btn" title="Menu Pengguna" @click="toggleDropdown" style="color: var(--text-main); font-size: 15px; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border: none; cursor: pointer; transition: all 0.2s;">
            <i class="fa-solid fa-gear" :style="{ transform: isDropdownOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }"></i>
          </button>
          
          <!-- Dropdown Menu Box -->
          <div v-if="isDropdownOpen" class="user-dropdown-menu" style="position: absolute; right: 0; top: 42px; background: white; border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.1); width: 220px; z-index: 999; overflow: hidden; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <!-- Profile Info Display -->
            <div style="display: flex; gap: 10px; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--color-border); margin-bottom: 4px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">
                {{ avatarInitials }}
              </div>
              <div style="display: flex; flex-direction: column; overflow: hidden;">
                <span style="font-weight: 700; font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="userName">{{ userName }}</span>
                <span style="font-size: 11px; color: var(--color-primary); font-weight: 600;">{{ roleText }}</span>
              </div>
            </div>

            <!-- Settings (only for Super Admin / Pengelola) -->
            <a v-if="roleText === 'Super Admin' || roleText === 'Pengelola'" @click="$emit('navigate-settings'); closeDropdown();" style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; color: var(--text-main); font-size: 12.5px; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.15s;" onmouseover="this.style.background='var(--color-bg-light)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-sliders" style="color: var(--text-muted); font-size: 13px; width: 14px;"></i> Pengaturan Akun
            </a>

            <!-- Logout Link -->
            <a @click="$emit('logout'); closeDropdown();" style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; color: var(--color-rose); font-size: 12.5px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.15s; background-color: rgba(239, 68, 68, 0.05);" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.05)'">
              <i class="fa-solid fa-arrow-right-from-bracket" style="font-size: 13px; width: 14px;"></i> Keluar (Logout)
            </a>
          </div>
        </div>
      </div>
    </header>
  `
};

// 3. Placeholder Component
window.PlaceholderComponent = {
  props: {
    activePage: { type: String, required: true },
    activePageLabel: { type: String, required: true },
    placeholderDesc: { type: String, required: true },
    iconClass: { type: String, default: 'fa-folder-open' }
  },
  emits: ['go-home'],
  setup(props, { emit }) {
    const goHome = () => {
      emit('go-home');
    };
    const alertDraft = () => {
      alert(`Formulir mock up untuk modul ${props.activePageLabel} sedang dirancang.`);
    };
    return { goHome, alertDraft };
  },
  template: `
    <div class="placeholder-view">
      <div class="placeholder-icon">
        <i class="fa-solid" :class="iconClass"></i>
      </div>
      <div class="placeholder-badge">
        <i class="fa-solid fa-hourglass-half"></i> Tahap Perancangan UI
      </div>
      <h2 class="placeholder-title">Modul {{ activePageLabel }}</h2>
      <p class="placeholder-desc">{{ placeholderDesc }}</p>
      <div class="placeholder-actions">
        <button class="btn-flat" @click="goHome">
          <i class="fa-solid fa-house"></i> Kembali ke Dashboard
        </button>
    </div>
  `
};

// 4. CrudManagerComponent (Autonomous CRUD Table and Modal Engine)
window.CrudManagerComponent = {
  props: {
    sheetName: { type: String, required: true },
    sheetLabel: { type: String, required: true },
    schema: { type: Array, required: true },
    dataList: { type: Array, required: true }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    const searchQuery = Vue.ref('');
    const isModalOpen = Vue.ref(false);
    const isEditMode = Vue.ref(false);
    const isLoading = Vue.ref(false);
    
    // Form model reactive state
    const formData = Vue.reactive({});

    // PK detection
    const pkField = Vue.computed(() => {
      return props.schema.length > 0 ? props.schema[0].name : 'id';
    });

    const visibleSchema = Vue.computed(() => {
      // Hilangkan kolom PK (ID) agar tabel terlihat bersih sesuai permintaan pengguna
      return props.schema.filter(f => !f.isVirtual && f.name !== pkField.value);
    });

    const formSchema = Vue.computed(() => {
      let fields = props.schema.filter(f => !f.disabled && f.name !== pkField.value);
      if (isEditMode.value) {
        // Jangan tampilkan username & password di form edit standar (gunakan aksi terpisah)
        fields = fields.filter(f => !f.isVirtual);
      }
      return fields;
    });

    // Filter data based on search input
    const filteredData = Vue.computed(() => {
      const list = props.dataList || [];
      if (!searchQuery.value || searchQuery.value.trim() === '') {
        return list;
      }
      const q = searchQuery.value.toLowerCase().trim();
      return list.filter(item => {
        return Object.values(item).some(val => 
          val !== null && val !== undefined && val.toString().toLowerCase().includes(q)
        );
      });
    });

    // Open Modal for Create
    const openCreateModal = () => {
      isEditMode.value = false;
      isModalOpen.value = true;
      
      // Initialize form with default/empty values
      props.schema.forEach(field => {
        if (field.name === pkField.value) {
          formData[field.name] = 'Generated Otomatis';
        } else {
          formData[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
        }
      });
    };

    // Open Modal for Edit
    const openEditModal = (item) => {
      isEditMode.value = true;
      isModalOpen.value = true;
      
      // Populate fields
      props.schema.forEach(field => {
        formData[field.name] = item[field.name] !== undefined ? item[field.name] : '';
        // If type is date and value is raw timestamp, format to YYYY-MM-DD
        if (field.type === 'date' && formData[field.name]) {
          try {
            const d = new Date(formData[field.name]);
            if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              formData[field.name] = `${year}-${month}-${day}`;
            }
          } catch(e) {}
        }
      });

      // Pull linked user account data for Siswa or Pegawai
      if (props.sheetName === 'Siswa' || props.sheetName === 'Pegawai') {
        const users = window.getRoleData ? (window.getRoleData("Users") || []) : [];
        const pk = props.schema[0].name;
        const linkedId = item[pk];
        const userRec = users.find(u => u.linked_id === linkedId);
        if (userRec) {
          formData.username = userRec.username;
          formData.password = ''; // Leave password blank on update
        } else {
          formData.username = '';
          formData.password = '';
        }
      }
    };

    // Submit form handler
    const handleSubmit = async () => {
      isLoading.value = true;
      const action = isEditMode.value ? 'update' : 'create';
      
      // Construct payload copy
      const payload = {};
      props.schema.forEach(field => {
        if (field.name === pkField.value && action === 'create') {
          // Do not send PK on create, Apps Script generates it
          return;
        }
        
        let val = formData[field.name];
        // Cast types
        if (field.type === 'number') {
          val = val === '' ? 0 : parseFloat(val);
        }
        payload[field.name] = val;
      });

      try {
        const result = await window.saveDatabaseRecord(props.sheetName, action, payload);
        isModalOpen.value = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Disimpan',
          text: `Data ${props.sheetLabel} berhasil disimpan ke database.`,
          timer: 1500,
          showConfirmButton: false
        });
        
        emit('refresh');
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: err.message || 'Kesalahan sistem saat menyimpan data.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Delete record handler
    const handleDelete = (item) => {
      const idVal = item[pkField.value];
      
      Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Data ${props.sheetLabel} dengan ID ${idVal} akan dihapus permanen!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
      }).then(async (result) => {
        if (result.isConfirmed) {
          isLoading.value = true;
          try {
            await window.deleteDatabaseRecord(props.sheetName, idVal);
            
            Swal.fire({
              icon: 'success',
              title: 'Berhasil Dihapus',
              text: `Data ${props.sheetLabel} berhasil dihapus.`,
              timer: 1500,
              showConfirmButton: false
            });
            
            emit('refresh');
          } catch(err) {
            Swal.fire({
              icon: 'error',
              title: 'Gagal Dihapus',
              text: err.message || 'Kesalahan sistem saat menghapus data.',
              confirmButtonColor: '#ef4444'
            });
          } finally {
            isLoading.value = false;
          }
        }
      });
    };

    // Account Settings Modal state for Siswa and Pegawai
    const isAccountModalOpen = Vue.ref(false);
    const isAccountSaving = Vue.ref(false);
    const selectedAccountName = Vue.ref('');
    const accountForm = Vue.reactive({
      username: '',
      password: ''
    });
    let activeItemForAccount = null;
    let activeUserRecord = null;

    const openAccountSettingsModal = (item) => {
      activeItemForAccount = item;
      selectedAccountName.value = item.nama || item.nama_orang_tua || 'User';
      
      const usersList = window.getRoleData ? window.getRoleData("Users") : [];
      const idVal = item[pkField.value];
      activeUserRecord = usersList.find(u => u.linked_id === idVal);
      
      if (activeUserRecord) {
        accountForm.username = activeUserRecord.username;
      } else {
        // Otomatis generate username jika akun belum ada
        accountForm.username = (item.nama || item.siswa_id || item.pegawai_id).toLowerCase().replace(/\s+/g, '');
      }
      accountForm.password = ''; // Kosongkan password baru
      isAccountModalOpen.value = true;
    };

    const saveAccountSettings = async () => {
      isAccountSaving.value = true;
      try {
        const payload = {
          username: accountForm.username,
          role: props.sheetName === 'Siswa' ? 'parent' : (activeItemForAccount.jabatan_id === 'JAB-001' ? 'pengelola' : 'tentor'),
          display_name: activeItemForAccount.nama || activeItemForAccount.nama_orang_tua || 'User',
          linked_id: activeItemForAccount[pkField.value],
          status: 'Aktif'
        };
        
        if (accountForm.password && accountForm.password.trim() !== '') {
          // Hash password secara aman menggunakan utilitas SHA-256 global
          payload.password_hash = await window.sha256Hash(accountForm.password);
        } else if (activeUserRecord) {
          payload.password_hash = activeUserRecord.password_hash;
        } else {
          throw new Error("Password harus diisi untuk pembuatan akun baru!");
        }

        let action = 'create';
        if (activeUserRecord) {
          action = 'update';
          payload.user_id = activeUserRecord.user_id;
        }

        Swal.fire({
          title: 'Menyimpan Akun...',
          text: 'Mengirimkan pembaruan kredensial login',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        await window.saveDatabaseRecord('Users', action, payload);
        
        Swal.fire({
          icon: 'success',
          title: 'Akun Diperbarui',
          text: 'Informasi login akun berhasil disimpan.',
          timer: 1500,
          showConfirmButton: false
        });
        
        isAccountModalOpen.value = false;
        emit('refresh');
      } catch(err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Akun',
          text: err.message || 'Terjadi kesalahan sistem.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        isAccountSaving.value = false;
      }
    };

    return {
      searchQuery,
      isModalOpen,
      isEditMode,
      isLoading,
      formData,
      pkField,
      filteredData,
      visibleSchema,
      formSchema,
      openCreateModal,
      openEditModal,
      handleSubmit,
      handleDelete,
      
      // Account Settings Modal
      isAccountModalOpen,
      isAccountSaving,
      selectedAccountName,
      accountForm,
      openAccountSettingsModal,
      saveAccountSettings
    };
  },
  template: `
    <div class="content-card" style="padding: 24px;">
      <!-- Table Header & Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div style="position: relative; max-width: 320px; width: 100%;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 13.5px;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari data..." 
            style="width: 100%; height: 38px; padding: 0 12px 0 36px; border: 1px solid var(--color-border); border-radius: 6px; outline: none; font-size: 13.5px;"
          />
        </div>
        <button class="btn-flat btn-navy" @click="openCreateModal">
          <i class="fa-solid fa-plus"></i> Tambah {{ sheetLabel }}
        </button>
      </div>

      <!-- Data Table View -->
      <div class="table-responsive-wrapper" style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 12px; background: white;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 12px; min-width: 800px;">
          <thead>
            <tr style="background-color: var(--color-bg-light); border-bottom: 1px solid var(--color-border);">
              <th v-for="field in visibleSchema" :key="field.name" style="padding: 10px 12px; font-weight: 600; color: var(--text-main); font-size: 12.5px;">
                {{ field.label }}
              </th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-main); text-align: center; width: 120px; font-size: 12.5px;">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredData.length === 0">
              <td :colspan="visibleSchema.length + 1" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
                <i class="fa-solid fa-inbox" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                Tidak ada data ditemukan.
              </td>
            </tr>
            <tr v-for="(item, idx) in filteredData" :key="idx" style="border-bottom: 1px solid var(--color-border); transition: background 0.15s;" hover-style="background-color: var(--color-bg-light);">
              <td v-for="field in visibleSchema" :key="field.name" style="padding: 10px 12px; color: var(--text-main); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;">
                <!-- Type date formatter -->
                <span v-if="field.type === 'date' && item[field.name]">
                  {{ new Date(item[field.name]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </span>
                <!-- Number formatter -->
                <span v-else-if="field.type === 'number' && item[field.name] !== undefined">
                  {{ field.isCurrency ? 'Rp ' + parseFloat(item[field.name]).toLocaleString('id-ID') : item[field.name] }}
                </span>
                <!-- Dropdown display formatting labels -->
                <span v-else-if="field.type === 'select' && field.options">
                  {{ typeof field.options === 'function' ? (field.options().find(o => o.value == item[field.name])?.label || item[field.name]) : (field.options.find(o => o.value == item[field.name])?.label || item[field.name]) }}
                </span>
                <!-- Standard text -->
                <span v-else>{{ item[field.name] }}</span>
              </td>
              <!-- Action Buttons -->
              <td style="padding: 10px 12px; text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                  <button 
                    v-if="sheetName === 'Siswa' || sheetName === 'Pegawai'"
                    @click="openAccountSettingsModal(item)" 
                    style="border: none; background: rgba(16, 185, 129, 0.1); color: var(--color-emerald); width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
                    title="Kelola Akun Login"
                  >
                    <i class="fa-solid fa-key" style="font-size: 11px;"></i>
                  </button>
                  <button 
                    @click="openEditModal(item)" 
                    style="border: none; background: rgba(59, 130, 246, 0.1); color: var(--color-blue); width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
                    title="Ubah"
                  >
                    <i class="fa-solid fa-pen-to-square" style="font-size: 11px;"></i>
                  </button>
                  <button 
                    @click="handleDelete(item)" 
                    style="border: none; background: rgba(239, 68, 68, 0.1); color: var(--color-rose); width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
                    title="Hapus"
                  >
                    <i class="fa-solid fa-trash-can" style="font-size: 11px;"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CREATE / EDIT MODAL DIALOG -->
      <div v-if="isModalOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 950; padding: 20px;">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 15px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
          <!-- Modal Header -->
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">
              {{ isEditMode ? 'Ubah Data' : 'Tambah Data' }} {{ sheetLabel }}
            </h3>
            <button @click="isModalOpen = false" style="background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted);">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Modal Form Form -->
          <form @submit.prevent="handleSubmit">
            <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
              <div v-for="field in formSchema" :key="field.name" style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-main);">
                  {{ field.label }} <span v-if="field.required" style="color: var(--color-rose);">*</span>
                </label>
                
                <!-- SELECT FIELD -->
                <select 
                  v-if="field.type === 'select'" 
                  v-model="formData[field.name]" 
                  :required="field.required"
                  :disabled="field.disabled"
                  style="height: 38px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 13.5px; outline: none; background: white;"
                >
                  <option value="" disabled>Pilih {{ field.label }}</option>
                  <option 
                    v-for="opt in (typeof field.options === 'function' ? field.options() : field.options)" 
                    :key="opt.value" 
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>

                <!-- TEXTAREA FIELD -->
                <textarea 
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.name]"
                  :required="field.required"
                  :disabled="field.disabled"
                  style="padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 13.5px; outline: none; height: 80px; resize: none;"
                ></textarea>

                <!-- STANDARD TEXT/NUMBER/DATE/TIME INPUTS -->
                <input 
                  v-else
                  :type="field.type" 
                  v-model="formData[field.name]" 
                  :required="field.required && !(isEditMode && field.name === 'password')"
                  :disabled="field.disabled"
                  style="height: 38px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 13.5px; outline: none; background: white;"
                />
              </div>
            </div>

            <!-- Modal Actions Footer -->
            <div style="padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 12px; background-color: var(--color-bg-light); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <button type="button" class="btn-flat btn-flat-secondary" @click="isModalOpen = false" :disabled="isLoading">
                Batal
              </button>
              <button type="submit" class="btn-flat" :disabled="isLoading">
                <span v-if="isLoading">Menyimpan... <i class="fa-solid fa-spinner fa-spin"></i></span>
                <span v-else>Simpan</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ACCOUNT SETTINGS MODAL (for Siswa/Pegawai only) -->
      <div v-if="isAccountModalOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 950; padding: 20px;">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 15px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
          <!-- Modal Header -->
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; margin: 0;">
              <i class="fa-solid fa-key" style="color: var(--color-emerald);"></i> Kelola Akun: {{ selectedAccountName }}
            </h3>
            <button @click="isAccountModalOpen = false" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); line-height: 1;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Modal Form -->
          <form @submit.prevent="saveAccountSettings">
            <div style="padding: 24px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 12.5px; font-weight: 600; color: var(--text-main); text-align: left;">Username Login</label>
                <input type="text" v-model="accountForm.username" required style="height: 38px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 13.5px; outline: none; background: white;" />
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 12.5px; font-weight: 600; color: var(--text-main); text-align: left;">Sandi Baru (Kosongkan jika tidak ingin diubah)</label>
                <input type="password" v-model="accountForm.password" placeholder="Masukkan sandi baru" style="height: 38px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 13.5px; outline: none; background: white;" />
              </div>
            </div>

            <!-- Modal Footer -->
            <div style="padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 12px; background-color: var(--color-bg-light); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <button type="button" class="btn-flat btn-flat-secondary" @click="isAccountModalOpen = false" :disabled="isAccountSaving" style="padding: 8px 16px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 13px;">
                Batal
              </button>
              <button type="submit" class="btn-flat btn-navy" :disabled="isAccountSaving" style="padding: 8px 16px; border: none; border-radius: 6px; background: var(--color-primary); color: white; cursor: pointer; font-size: 13px; font-weight: 600;">
                <span v-if="isAccountSaving">Menyimpan... <i class="fa-solid fa-spinner fa-spin"></i></span>
                <span v-else>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};

