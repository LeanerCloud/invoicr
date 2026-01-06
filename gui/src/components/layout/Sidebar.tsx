import { useState, useEffect } from 'react';
import { Building2, Users, ChevronRight, ChevronDown, Plus, MessageSquare, Briefcase, Info, Settings, FileText, Layers } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { personasApi, clientsApi, demoApi, type PersonaInfo, type ClientSummary } from '../../services/api';
import { AboutModal } from './AboutModal';
import { SettingsModal } from './SettingsModal';

type View = 'provider' | 'clients' | 'client-edit' | 'client-new' | 'invoice' | 'history' | 'templates' | 'batch';

interface SidebarProps {
  currentView: View;
  selectedPersona: string | null;
  selectedClient: string | null;
  onNavigate: (view: View) => void;
  onSelectPersona: (persona: string) => void;
  onSelectClient: (persona: string, client: string) => void;
  onCreatePersona: () => void;
  refreshTrigger?: number; // Increment to trigger a refresh
}

interface ExpandedState {
  [personaName: string]: boolean;
}

export function Sidebar({
  currentView,
  selectedPersona,
  selectedClient,
  onNavigate,
  onSelectPersona,
  onSelectClient,
  onCreatePersona,
  refreshTrigger,
}: SidebarProps) {
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [clientsByPersona, setClientsByPersona] = useState<Record<string, ClientSummary[]>>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleOpenLink = async (url: string) => {
    try {
      await open(url);
    } catch (err) {
      console.error('Failed to open link:', err);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    loadPersonas();
  }, [refreshTrigger]);

  const loadPersonas = async () => {
    try {
      let data = await personasApi.list();

      // Initialize demo data on first run if no personas exist
      const demoInitialized = localStorage.getItem('invoicr_demo_initialized');
      if (data.length === 0 && !demoInitialized) {
        try {
          const result = await demoApi.initDemo();
          if (result.created) {
            // Reload personas after demo creation
            data = await personasApi.list();
          }
        } catch (demoErr) {
          console.error('Failed to initialize demo:', demoErr);
        }
        // Mark as initialized so we don't try again if user deletes it
        localStorage.setItem('invoicr_demo_initialized', 'true');
      }

      setPersonas(data);

      // Auto-expand first persona and load its clients
      if (data.length > 0) {
        const firstPersona = data[0].name;
        setExpanded({ [firstPersona]: true });
        loadClientsForPersona(firstPersona);

        // Auto-select first persona if none selected
        if (!selectedPersona) {
          onSelectPersona(firstPersona);
        }
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsForPersona = async (personaName: string) => {
    try {
      const clients = await clientsApi.list(personaName);
      setClientsByPersona(prev => ({ ...prev, [personaName]: clients }));
    } catch (err) {
      console.error(`Failed to load clients for ${personaName}:`, err);
    }
  };

  const togglePersona = (personaName: string) => {
    const isExpanding = !expanded[personaName];
    setExpanded(prev => ({ ...prev, [personaName]: isExpanding }));

    if (isExpanding && !clientsByPersona[personaName]) {
      loadClientsForPersona(personaName);
    }
  };

  const handlePersonaClick = (personaName: string) => {
    onSelectPersona(personaName);
    togglePersona(personaName);
  };

  const handleProviderClick = (personaName: string) => {
    onSelectPersona(personaName);
    onNavigate('provider');
  };

  const handleTemplatesClick = (personaName: string) => {
    onSelectPersona(personaName);
    onNavigate('templates');
  };

  const handleBatchClick = (personaName: string) => {
    onSelectPersona(personaName);
    onNavigate('batch');
  };

  const handleClientClick = (personaName: string, clientName: string) => {
    onSelectClient(personaName, clientName);
    onNavigate('client-edit');
  };

  const handleNewClientClick = (personaName: string) => {
    onSelectPersona(personaName);
    onNavigate('client-new');
  };

  if (loading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 text-gray-500 text-sm">Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* New Business Activity Button */}
        <button
          onClick={onCreatePersona}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
        >
          <Plus className="mr-2 h-4 w-4 text-gray-400" />
          New Business Activity
        </button>

        <div className="h-px bg-gray-200 my-2" />

        {/* Persona List */}
        {personas.map((persona) => {
          const isExpanded = expanded[persona.name];
          const isSelected = selectedPersona === persona.name;
          const clients = clientsByPersona[persona.name] || [];

          return (
            <div key={persona.name} className="space-y-0.5">
              {/* Persona Header */}
              <button
                onClick={() => handlePersonaClick(persona.name)}
                className={`w-full flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isSelected && currentView === 'provider'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="mr-1 h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="mr-1 h-4 w-4 text-gray-400" />
                )}
                <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
                <span className="truncate">{persona.name}</span>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="ml-5 pl-2 border-l border-gray-200 space-y-0.5">
                  {/* Provider */}
                  <button
                    onClick={() => handleProviderClick(persona.name)}
                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                      isSelected && currentView === 'provider'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Provider</span>
                    {!persona.hasProvider && (
                      <span className="ml-auto text-xs text-amber-500">Setup</span>
                    )}
                  </button>

                  {/* Templates */}
                  <button
                    onClick={() => handleTemplatesClick(persona.name)}
                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                      isSelected && currentView === 'templates'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Templates</span>
                  </button>

                  {/* Batch Invoicing */}
                  <button
                    onClick={() => handleBatchClick(persona.name)}
                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                      isSelected && currentView === 'batch'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Layers className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Batch Invoicing</span>
                  </button>

                  {/* Clients Header */}
                  <div className="flex items-center px-2 py-1.5 text-sm text-gray-500">
                    <button
                      onClick={() => {
                        onSelectPersona(persona.name);
                        onNavigate('clients');
                      }}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      <Users className="mr-2 h-4 w-4 text-gray-400" />
                      <span>Clients</span>
                    </button>
                    <button
                      onClick={() => handleNewClientClick(persona.name)}
                      className="ml-auto p-0.5 hover:bg-gray-200 rounded"
                      title="Add client"
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>

                  {/* Client List */}
                  {clients.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-gray-400 italic">
                      No clients yet
                    </div>
                  ) : (
                    clients.map((client) => {
                      const isClientSelected =
                        isSelected && selectedClient === client.name;
                      const isClientActive =
                        isClientSelected &&
                        ['client-edit', 'invoice', 'history'].includes(currentView);

                      return (
                        <button
                          key={client.name}
                          onClick={() => handleClientClick(persona.name, client.name)}
                          className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                            isClientActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{client.displayName}</span>
                          <span className="ml-auto text-xs text-gray-400">
                            {client.invoicePrefix}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {personas.length === 0 && (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            No business activities yet.
            <br />
            Click "New Business Activity" to get started.
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => handleOpenLink('https://github.com/LeanerCloud/invoicr/issues/new?title=Feedback%3A%20&labels=feedback&body=%23%23%20Feedback%0A%0A%3C!--%20Describe%20your%20feedback%2C%20feature%20request%2C%20or%20bug%20report%20here%20--%3E%0A%0A%23%23%20Environment%0A-%20App%20version%3A%20%0A-%20OS%3A%20')}
          className="flex items-center text-xs text-gray-500 hover:text-primary-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Feedback
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center text-xs text-gray-400 hover:text-primary-600 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center text-xs text-gray-400 hover:text-primary-600 transition-colors"
        >
          <Info className="w-4 h-4 mr-2" />
          About Invoicr
        </button>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
