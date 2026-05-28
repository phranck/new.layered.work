export type DashboardLocale = "de" | "en";

export interface DashboardMessages {
  common: {
    ok: string;
    cancel: string;
    save: string;
    saving: string;
    saved: string;
    edit: string;
    create: string;
    delete: string;
    remove: string;
    duplicate: string;
    copy: string;
    copyUrl: string;
    import: string;
    export: string;
    approve: string;
    reject: string;
    restore: string;
    putOnHold: string;
    overwrite: string;
    skip: string;
    close: string;
    loading: string;
    unknownError: string;
  };
  layout: {
    menuOpen: string;
    menuClose: string;
    resizeSidebar: string;
    pageFallbackTitle: string;
    sidebar: {
      sectionGeneral: string;
      sectionContent: string;
      sectionSystem: string;
      overview: string;
      design: string;
      projects: string;
      posts: string;
      pages: string;
      pagesOverview: string;
      navigations: string;
      settings: string;
      users: string;
      expandAll: string;
      collapseAll: string;
      expandAllAria: string;
      collapseAllAria: string;
      editProfile: string;
      logout: string;
      logoutConfirmTitle: string;
      logoutConfirmDescription: string;
      logoutConfirmAction: string;
      logoutSkipConfirm: string;
      logoutConfirmLabel: string;
      roles: {
        owner: string;
        admin: string;
        editor: string;
      };
    };
  };
  auth: {
    logoAlt: string;
    login: {
      title: string;
      username: string;
      password: string;
      invalidCredentials: string;
      submit: string;
      submitLoading: string;
    };
    setup: {
      title: string;
      subtitle: string;
      email: string;
      displayName: string;
      confirmPassword: string;
      passwordMismatch: string;
      genericError: string;
      submit: string;
      submitLoading: string;
    };
  };
  content: {
    editor: {
      decreaseFontSize: string;
      increaseFontSize: string;
      deletePage: string;
      confirmDelete: string;
      confirmDeleteAction: string;
      saved: string;
      titleLabel: string;
      slugLabel: string;
      statusLabel: string;
      ok: string;
      statusDraft: string;
      statusPublished: string;
      statusHidden: string;
      showTitleLabel: string;
      createdBy: string;
      updatedBy: string;
      loadingContent: string;
      saveError: string;
      preview: string;
      shortcuts: {
        save: string;
        bold: string;
        italic: string;
        strikethrough: string;
        link: string;
      };
    };
    pages: {
      title: string;
      newPage: string;
      createTitle: string;
      fieldTitle: string;
      fieldSlug: string;
      titlePlaceholder: string;
      slugPlaceholder: string;
      create: string;
      creating: string;
      createError: string;
      confirmDeleteDescription: string;
      loadPages: string;
      emptyPages: string;
      emptyPagesHint: string;
      deletePageTitle: string;
      table: {
        title: string;
        slug: string;
        status: string;
        createdBy: string;
        updatedAt: string;
      };
      status: {
        published: string;
        hidden: string;
        draft: string;
      };
    };
  };
  users: {
    title: string;
    inviteUser: string;
    you: string;
    remove: string;
    removeConfirmTitle: string;
    removeConfirmDescription: string;
    role: {
      owner: string;
      admin: string;
      editor: string;
    };
    editCard: {
      title: string;
      editTooltip: string;
      createTitle: string;
      errorSaving: string;
    };
  };
}

export const messages: Record<DashboardLocale, DashboardMessages> = {
  en: {
    common: {
      ok: "OK",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving",
      saved: "Saved",
      edit: "Edit",
      create: "Create",
      delete: "Delete",
      remove: "Remove",
      duplicate: "Duplicate",
      copy: "Copy",
      copyUrl: "Copy URL",
      import: "Import",
      export: "Export",
      approve: "Approve",
      reject: "Reject",
      restore: "Restore",
      putOnHold: "Put on hold",
      overwrite: "Overwrite",
      skip: "Skip",
      close: "Close",
      loading: "Loading",
      unknownError: "Unknown error",
    },
    layout: {
      menuOpen: "Open menu",
      menuClose: "Close menu",
      resizeSidebar: "Resize sidebar",
      pageFallbackTitle: "layered.work Dashboard",
      sidebar: {
        sectionGeneral: "General",
        sectionContent: "Content",
        sectionSystem: "System",
        overview: "Overview",
        design: "Design",
        projects: "Projects",
        posts: "Posts",
        pages: "Pages",
        pagesOverview: "All pages",
        navigations: "Navigations",
        settings: "Settings",
        users: "Users",
        expandAll: "Expand all",
        collapseAll: "Collapse all",
        expandAllAria: "Expand all sidebar groups",
        collapseAllAria: "Collapse all sidebar groups",
        editProfile: "Edit profile",
        logout: "Logout",
        logoutConfirmTitle: "Logout",
        logoutConfirmDescription: "Do you really want to end this dashboard session?",
        logoutConfirmAction: "Logout",
        logoutSkipConfirm: "Do not ask again",
        logoutConfirmLabel: "Confirm logout before signing out",
        roles: { owner: "Owner", admin: "Admin", editor: "Editor" },
      },
    },
    auth: {
      logoAlt: "layered.work",
      login: {
        title: "Sign in",
        username: "Username",
        password: "Password",
        invalidCredentials: "Invalid credentials",
        submit: "Sign in",
        submitLoading: "Signing in",
      },
      setup: {
        title: "Initial setup",
        subtitle: "Create the first owner account for this dashboard.",
        email: "Email",
        displayName: "Display name",
        confirmPassword: "Confirm password",
        passwordMismatch: "Passwords do not match",
        genericError: "Setup failed",
        submit: "Create owner",
        submitLoading: "Creating",
      },
    },
    content: {
      editor: {
        decreaseFontSize: "Decrease font size",
        increaseFontSize: "Increase font size",
        deletePage: "Delete page",
        confirmDelete: "Delete permanently?",
        confirmDeleteAction: "Yes, delete",
        saved: "Saved",
        titleLabel: "Title",
        slugLabel: "Slug",
        statusLabel: "Status",
        ok: "OK",
        statusDraft: "Draft",
        statusPublished: "Published",
        statusHidden: "Hidden",
        showTitleLabel: "Show title",
        createdBy: "Created by",
        updatedBy: "Updated by",
        loadingContent: "Loading content…",
        saveError: "Error while saving. Please try again.",
        preview: "Preview",
        shortcuts: {
          save: "Save",
          bold: "Bold",
          italic: "Italic",
          strikethrough: "Strikethrough",
          link: "Link",
        },
      },
      pages: {
        title: "Pages",
        newPage: "New page",
        createTitle: "Create new page",
        fieldTitle: "Title",
        fieldSlug: "Slug (URL path)",
        titlePlaceholder: "e.g. About us",
        slugPlaceholder: "about-us",
        create: "Create",
        creating: "Creating…",
        createError: "Error while creating",
        confirmDeleteDescription: "Do you really want to delete the following page?",
        loadPages: "Loading pages…",
        emptyPages: "No pages available yet.",
        emptyPagesHint: "Create your first page using the + button.",
        deletePageTitle: "Delete page",
        table: {
          title: "Title",
          slug: "Slug",
          status: "Status",
          createdBy: "Created by",
          updatedAt: "Updated at",
        },
        status: {
          published: "Published",
          hidden: "Hidden",
          draft: "Draft",
        },
      },
    },
    users: {
      title: "Users",
      inviteUser: "Create user",
      you: "You",
      remove: "Remove",
      removeConfirmTitle: "Remove user",
      removeConfirmDescription: "will be removed from the dashboard.",
      role: { owner: "Owner", admin: "Admin", editor: "Editor" },
      editCard: {
        title: "Edit user",
        editTooltip: "Edit user",
        createTitle: "Create user",
        errorSaving: "Could not save user",
      },
    },
  },
  de: {
    common: {
      ok: "OK",
      cancel: "Abbrechen",
      save: "Speichern",
      saving: "Speichern",
      saved: "Gespeichert",
      edit: "Bearbeiten",
      create: "Erstellen",
      delete: "Loeschen",
      remove: "Entfernen",
      duplicate: "Duplizieren",
      copy: "Kopieren",
      copyUrl: "URL kopieren",
      import: "Importieren",
      export: "Exportieren",
      approve: "Freigeben",
      reject: "Ablehnen",
      restore: "Wiederherstellen",
      putOnHold: "Zurueckstellen",
      overwrite: "Ueberschreiben",
      skip: "Ueberspringen",
      close: "Schliessen",
      loading: "Laedt",
      unknownError: "Unbekannter Fehler",
    },
    layout: {
      menuOpen: "Menue oeffnen",
      menuClose: "Menue schliessen",
      resizeSidebar: "Sidebar skalieren",
      pageFallbackTitle: "layered.work Dashboard",
      sidebar: {
        sectionGeneral: "Allgemein",
        sectionContent: "Inhalte",
        sectionSystem: "System",
        overview: "Uebersicht",
        design: "Design",
        projects: "Projekte",
        posts: "Posts",
        pages: "Seiten",
        pagesOverview: "Alle Seiten",
        navigations: "Navigationen",
        settings: "Settings",
        users: "Benutzer",
        expandAll: "Alle aufklappen",
        collapseAll: "Alle zuklappen",
        expandAllAria: "Alle Sidebar-Gruppen aufklappen",
        collapseAllAria: "Alle Sidebar-Gruppen zuklappen",
        editProfile: "Profil bearbeiten",
        logout: "Logout",
        logoutConfirmTitle: "Logout",
        logoutConfirmDescription: "Moechtest du diese Dashboard-Session wirklich beenden?",
        logoutConfirmAction: "Logout",
        logoutSkipConfirm: "Nicht erneut fragen",
        logoutConfirmLabel: "Logout vor dem Abmelden bestaetigen",
        roles: { owner: "Owner", admin: "Admin", editor: "Editor" },
      },
    },
    auth: {
      logoAlt: "layered.work",
      login: {
        title: "Anmelden",
        username: "Benutzername",
        password: "Passwort",
        invalidCredentials: "Ungueltige Zugangsdaten",
        submit: "Anmelden",
        submitLoading: "Anmelden",
      },
      setup: {
        title: "Initiales Setup",
        subtitle: "Erstelle den ersten Owner-Account fuer dieses Dashboard.",
        email: "E-Mail",
        displayName: "Anzeigename",
        confirmPassword: "Passwort bestaetigen",
        passwordMismatch: "Passwoerter stimmen nicht ueberein",
        genericError: "Setup fehlgeschlagen",
        submit: "Owner erstellen",
        submitLoading: "Erstellen",
      },
    },
    content: {
      editor: {
        decreaseFontSize: "Schriftgröße verkleinern",
        increaseFontSize: "Schriftgröße vergrößern",
        deletePage: "Seite löschen",
        confirmDelete: "Wirklich löschen?",
        confirmDeleteAction: "Ja, löschen",
        saved: "Gespeichert",
        titleLabel: "Titel",
        slugLabel: "Slug",
        statusLabel: "Status",
        ok: "OK",
        statusDraft: "Entwurf",
        statusPublished: "Veröffentlicht",
        statusHidden: "Versteckt",
        showTitleLabel: "Titel anzeigen",
        createdBy: "Erstellt von",
        updatedBy: "Geändert von",
        loadingContent: "Lade Inhalt…",
        saveError: "Fehler beim Speichern. Bitte erneut versuchen.",
        preview: "Vorschau",
        shortcuts: {
          save: "Speichern",
          bold: "Fett",
          italic: "Kursiv",
          strikethrough: "Durchgestrichen",
          link: "Link",
        },
      },
      pages: {
        title: "Seiten",
        newPage: "Neue Seite",
        createTitle: "Neue Seite erstellen",
        fieldTitle: "Titel",
        fieldSlug: "Slug (URL-Pfad)",
        titlePlaceholder: "z.B. Über uns",
        slugPlaceholder: "about",
        create: "Erstellen",
        creating: "Wird erstellt…",
        createError: "Fehler beim Erstellen",
        confirmDeleteDescription: "Soll die folgende Seite wirklich gelöscht werden?",
        loadPages: "Lade Seiten…",
        emptyPages: "Noch keine Seiten vorhanden.",
        emptyPagesHint: "Erstelle deine erste Seite über den +-Button.",
        deletePageTitle: "Seite löschen",
        table: {
          title: "Titel",
          slug: "Slug",
          status: "Status",
          createdBy: "Erstellt von",
          updatedAt: "Geändert am",
        },
        status: {
          published: "Veröffentlicht",
          hidden: "Versteckt",
          draft: "Entwurf",
        },
      },
    },
    users: {
      title: "Benutzer",
      inviteUser: "Benutzer erstellen",
      you: "Du",
      remove: "Entfernen",
      removeConfirmTitle: "Benutzer entfernen",
      removeConfirmDescription: "wird aus dem Dashboard entfernt.",
      role: { owner: "Owner", admin: "Admin", editor: "Editor" },
      editCard: {
        title: "Benutzer bearbeiten",
        editTooltip: "Benutzer bearbeiten",
        createTitle: "Benutzer erstellen",
        errorSaving: "Benutzer konnte nicht gespeichert werden",
      },
    },
  },
};
