'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, ExternalLink, X, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HandshakeIdeaLab() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<any>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [creatingPrototype, setCreatingPrototype] = useState<number | null>(null);
  const [tabs, setTabs] = useState(['🧪 Idea Laboratory', '📊 Reality Check', '🔥 Resume Roaster', '💰 Salary Check']);

  const [newIdea, setNewIdea] = useState<any>({
    title: '',
    userNeed: '',
    seoAbility: '',
    virality: '',
    upsell: '',
    dataNeeds: '',
    whyItWins: '',
    reach: 5,
    impact: 5,
    confidence: 5,
    effort: 5,
    reasoning: undefined
  });

  // Normalize database row to component format (database uses lowercase, component expects camelCase)
  const normalizeIdea = (idea: any): any => {
    if (!idea) return null;
    
    return {
      id: idea.id,
      title: idea.title || '',
      // Map from lowercase DB columns to camelCase component format
      userNeed: idea.userneed || idea.userNeed || idea.user_need || '',
      seoAbility: idea.seoability || idea.seoAbility || idea.seo_ability || '',
      virality: idea.virality || '',
      upsell: idea.upsell || '',
      dataNeeds: idea.dataneeds || idea.dataNeeds || idea.data_needs || '',
      whyItWins: idea.whyitwins || idea.whyItWins || idea.why_it_wins || '',
      reach: idea.reach ?? 5,
      impact: idea.impact ?? 5,
      confidence: idea.confidence ?? 5,
      effort: idea.effort ?? 5,
      hasPrototype: idea.hasprototype ?? idea.hasPrototype ?? idea.has_prototype ?? false,
      prototypeTab: idea.prototypetab ?? idea.prototypeTab ?? idea.prototype_tab ?? null,
      prototypeCode: idea.prototypecode ?? idea.prototypeCode ?? idea.prototype_code ?? null,
      prototypeConfig: idea.prototypeconfig ?? idea.prototypeConfig ?? idea.prototype_config ?? null,
      reasoning: idea.reasoning || {},
      created_at: idea.created_at || idea.createdAt
    };
  };

  // Load ideas from Supabase on mount
  useEffect(() => {
    console.log('Attempting to connect to Supabase...');
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    console.log('loadIdeas called');
    
    if (!supabase) {
      console.log('No supabase client, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to fetch ideas from database...');
      const { data, error } = await supabase.from('ideas').select('*');
      
      console.log('Response received:', { data, error });
      console.log('First idea sample:', data?.[0]);
      
      if (error) {
        console.error('Error loading ideas:', error);
        console.log('Error details:', error.message);
        setDbConnected(false);
      } else {
        // Successfully connected, even if data is empty
        console.log('Successfully connected! Data count:', data?.length || 0);
        setDbConnected(true);
        // Normalize and set ideas from database, even if empty
        const normalizedIdeas = (data || []).map(normalizeIdea);
        console.log('Normalized ideas:', normalizedIdeas);
        setIdeas(normalizedIdeas);
      }
    } catch (err: any) {
      console.error('Failed to connect to database:', err);
      console.log('Catch error details:', err.message);
      setDbConnected(false);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const saveIdeaToDb = async (idea: any) => {
    if (!supabase) return idea;

    try {
      // Convert camelCase to lowercase for database columns
      const dbIdea = {
        id: idea.id,
        title: idea.title,
        userneed: idea.userNeed,
        seoability: idea.seoAbility,
        virality: idea.virality,
        upsell: idea.upsell,
        dataneeds: idea.dataNeeds,
        whyitwins: idea.whyItWins,
        reach: idea.reach,
        impact: idea.impact,
        confidence: idea.confidence,
        effort: idea.effort,
        hasprototype: idea.hasPrototype,
        prototypetab: idea.prototypeTab,
        prototypecode: idea.prototypeCode,
        prototypeconfig: idea.prototypeConfig,
        reasoning: idea.reasoning,
        created_at: idea.created_at
      };
      
      const { data, error } = await supabase.from('ideas').insert(dbIdea).select();
      
      if (error) {
        console.error('Error saving idea:', error);
        return idea;
      }
      
      // Normalize the saved idea before returning
      return data && data[0] ? normalizeIdea(data[0]) : idea;
    } catch (err) {
      console.error('Failed to save to database:', err);
      return idea;
    }
  };

  const updateIdeaInDb = async (idea: any) => {
    if (!supabase) return;

    try {
      // Convert camelCase to lowercase for database columns
      const dbIdea = {
        title: idea.title,
        userneed: idea.userNeed,
        seoability: idea.seoAbility,
        virality: idea.virality,
        upsell: idea.upsell,
        dataneeds: idea.dataNeeds,
        whyitwins: idea.whyItWins,
        reach: idea.reach,
        impact: idea.impact,
        confidence: idea.confidence,
        effort: idea.effort,
        hasprototype: idea.hasPrototype,
        prototypetab: idea.prototypeTab,
        prototypecode: idea.prototypeCode,
        prototypeconfig: idea.prototypeConfig,
        reasoning: idea.reasoning
      };
      
      const { error } = await supabase
        .from('ideas')
        .update(dbIdea)
        .eq('id', idea.id);
      
      if (error) {
        console.error('Error updating idea:', error);
      }
    } catch (err) {
      console.error('Failed to update in database:', err);
    }
  };

  const calculateRICE = (reach: number, impact: number, confidence: number, effort: number) => {
    return Math.round((reach * impact * confidence) / effort);
  };

  const getRICEColor = (score: number) => {
    if (score >= 80) return '#D4EDDA';
    if (score >= 40) return '#FFF3CD';
    return '#FFE5D0';
  };

  const getScoreColor = (value: number, attribute: string) => {
    // For effort, lower is better
    if (attribute === 'effort') {
      if (value <= 3) return '#D4EDDA';
      if (value <= 6) return '#FFF3CD';
      return '#FFE5D0';
    }
    // For reach, impact, confidence, higher is better
    if (value >= 8) return '#D4EDDA';
    if (value >= 5) return '#FFF3CD';
    return '#FFE5D0';
  };

  const sortedIdeas = [...ideas].sort((a, b) => {
    const riceA = calculateRICE(a.reach, a.impact, a.confidence, a.effort);
    const riceB = calculateRICE(b.reach, b.impact, b.confidence, b.effort);
    return riceB - riceA;
  });

  const handleAddIdea = async () => {
    if (editingIdea) {
      // Update existing idea
      const updatedIdea = { 
        ...editingIdea, 
        ...newIdea,
        reasoning: (newIdea as any).reasoning || editingIdea.reasoning || {}
      };
      setIdeas(ideas.map(idea => 
        idea.id === editingIdea.id ? updatedIdea : idea
      ));
      await updateIdeaInDb(updatedIdea);
      setEditingIdea(null);
    } else {
      // Add new idea
      // Generate ID: use max existing ID + 1, or start at 1 if no ideas
      const newId = ideas.length > 0 && ideas.some(i => i.id) 
        ? Math.max(...ideas.map(i => i.id || 0)) + 1 
        : 1;
      const ideaToAdd = { 
        ...newIdea, 
        id: newId, 
        hasPrototype: false, 
        reasoning: (newIdea as any).reasoning || {},
        created_at: new Date().toISOString()
      };
      
      const savedIdea = await saveIdeaToDb(ideaToAdd);
      const normalizedSavedIdea = normalizeIdea(savedIdea);
      setIdeas([...ideas, normalizedSavedIdea]);
    }
    setShowAddModal(false);
    setNewIdea({
      title: '',
      userNeed: '',
      seoAbility: '',
      virality: '',
      upsell: '',
      dataNeeds: '',
      whyItWins: '',
      reach: 5,
      impact: 5,
      confidence: 5,
      effort: 5,
      reasoning: undefined as any
    });
  };

  const handleAutoFill = async () => {
    if (!newIdea.title) return;
    
    setAutoFilling(true);
    
    try {
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newIdea.title,
          userNeed: newIdea.userNeed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate idea');
      }

      const suggestions = await response.json();
      
      setNewIdea({
        ...newIdea,
        ...suggestions
      });
    } catch (error: any) {
      console.error('Error generating idea:', error);
      alert(`Failed to generate idea: ${error.message}. Please fill in the fields manually.`);
    } finally {
      setAutoFilling(false);
    }
  };

  const handleCreatePrototype = async (idea: any) => {
    if (!idea.userNeed) {
      alert('Please add a user need description before creating a prototype.');
      return;
    }

    setCreatingPrototype(idea.id);
    
    try {
      const response = await fetch('/api/generate-prototype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: idea.title,
          userNeed: idea.userNeed,
          upsell: idea.upsell,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prototype');
      }

      const result = await response.json();
      
      // Find the next available tab index (after the existing tabs)
      const nextTabIndex = tabs.length;
      
      // Update the idea with prototype info
      const updatedIdea = {
        ...idea,
        hasPrototype: true,
        prototypeTab: nextTabIndex,
        prototypeCode: result.prototypeCode,
        prototypeConfig: result.prototypeConfig,
      };
      
      // Update in state
      setIdeas(ideas.map(i => i.id === idea.id ? updatedIdea : i));
      
      // Update in database
      await updateIdeaInDb(updatedIdea);
      
      // Add new tab
      setTabs([...tabs, result.tabName || `${idea.title} Prototype`]);
      
      // Switch to the new prototype tab
      setActiveTab(nextTabIndex);
      
      alert('Prototype created successfully!');
    } catch (error: any) {
      console.error('Error creating prototype:', error);
      alert(`Failed to create prototype: ${error.message}`);
    } finally {
      setCreatingPrototype(null);
    }
  };

  const generateIdeaSuggestions = (title: string, userNeed = '') => {
    // Simulated AI logic - in production, this would call Claude API
    const titleLower = title.toLowerCase();
    
    let suggestions: any = {
      reach: 7,
      impact: 7,
      confidence: 6,
      effort: 5
    };

    // Pattern matching for common idea types
    if (titleLower.includes('salary') || titleLower.includes('pay') || titleLower.includes('compensation')) {
      suggestions = {
        userNeed: userNeed || 'Understanding fair market compensation and avoiding being underpaid',
        seoAbility: `High - "${title.toLowerCase()}", "salary calculator", "am I underpaid", "fair pay"`,
        virality: 'Very High - Money is inherently shareable, creates FOMO and comparison culture',
        upsell: 'See detailed salary data from companies hiring in your area (requires account)',
        dataNeeds: 'Public salary databases (Glassdoor, levels.fyi, H1B data) - readily available',
        whyItWins: 'Taps into universal concern about fair compensation. High emotional stakes drive engagement and conversion.',
        reach: 9,
        impact: 9,
        confidence: 7,
        effort: 4
      };
    } else if (titleLower.includes('resume') || titleLower.includes('cv')) {
      suggestions = {
        userNeed: userNeed || 'Getting honest, actionable feedback on resume quality before applying',
        seoAbility: `Medium-High - "resume review", "resume tips", "${title.toLowerCase()}"`,
        virality: 'High - Before/after transformations are shareable, self-improvement content resonates',
        upsell: 'Get matched to jobs where your improved resume stands out (requires account)',
        dataNeeds: 'Zero - Pure AI analysis with good prompting',
        whyItWins: 'Addresses skills gap anxiety. Low barrier to entry, immediate value, viral potential.',
        reach: 8,
        impact: 8,
        confidence: 8,
        effort: 2
      };
    } else if (titleLower.includes('interview')) {
      suggestions = {
        userNeed: userNeed || 'Preparing effectively for interviews with real questions from target companies',
        seoAbility: `High - "interview questions [company]", "${title.toLowerCase()}", "interview prep"`,
        virality: 'Medium - Useful but commoditized. Needs unique angle for virality.',
        upsell: 'Access detailed interview experiences from recent hires at your target companies (requires account)',
        dataNeeds: 'Scrape existing sources (Glassdoor, Blind, Reddit) + user contributions',
        whyItWins: 'Universal pain point in job search. Addresses preparedness anxiety.',
        reach: 8,
        impact: 7,
        confidence: 7,
        effort: 5
      };
    } else if (titleLower.includes('career') || titleLower.includes('path')) {
      suggestions = {
        userNeed: userNeed || 'Understanding what steps to take now to reach long-term career goals',
        seoAbility: `Medium - "career path to [role]", "${title.toLowerCase()}", "how to become"`,
        virality: 'Medium - Helpful but not inherently shareable without personalization',
        upsell: 'See who made this exact journey and connect with mentors (requires account)',
        dataNeeds: 'LinkedIn data analysis, job progression patterns - buildable with AI research',
        whyItWins: 'Provides strategic clarity in ambiguous career landscape. Differentiates from job boards.',
        reach: 7,
        impact: 8,
        confidence: 6,
        effort: 7
      };
    } else if (titleLower.includes('company') || titleLower.includes('employer') || titleLower.includes('workplace')) {
      suggestions = {
        userNeed: userNeed || 'Evaluating company culture and avoiding toxic workplaces before accepting offers',
        seoAbility: `Medium-High - "[company] reviews", "${title.toLowerCase()}", "company culture"`,
        virality: 'High - Drama and exposing bad actors drives shares and engagement',
        upsell: 'See detailed reviews from alumni at your school who work there (requires account)',
        dataNeeds: 'User-generated reviews - significant cold start problem',
        whyItWins: 'Mental health is top concern for Gen Z. Protective tool builds trust through transparency.',
        reach: 7,
        impact: 9,
        confidence: 5,
        effort: 8
      };
    } else if (titleLower.includes('cost') || titleLower.includes('afford') || titleLower.includes('budget')) {
      suggestions = {
        userNeed: userNeed || 'Understanding if salary offers can realistically support desired lifestyle',
        seoAbility: `High - "cost of living calculator", "can I afford", "${title.toLowerCase()}"`,
        virality: 'High - Shocking revelations about affordability are shareable',
        upsell: 'See real salary offers from companies in your target city (requires account)',
        dataNeeds: 'Public APIs (BLS, Numbeo, Zillow) - no proprietary data needed',
        whyItWins: 'Addresses financial anxiety and job security fears. Practical value for life decisions.',
        reach: 9,
        impact: 9,
        confidence: 9,
        effort: 3
      };
    } else if (titleLower.includes('skill')) {
      suggestions = {
        userNeed: userNeed || 'Identifying skill gaps and understanding how to build missing competencies',
        seoAbility: `Medium - "skills needed for [role]", "${title.toLowerCase()}", "learn skills"`,
        virality: 'Low - Educational content doesn\'t naturally go viral',
        upsell: 'Get matched to jobs that will help you build these exact skills (requires account)',
        dataNeeds: 'Job posting analysis, skills taxonomy - buildable with AI',
        whyItWins: 'Gen Z prefers practical skills training. Directly addresses preparedness gap.',
        reach: 6,
        impact: 7,
        confidence: 6,
        effort: 6
      };
    } else {
      // Generic defaults
      suggestions = {
        userNeed: userNeed || `Solving a key problem for early career job seekers related to: ${title}`,
        seoAbility: `To be determined - analyze search volume for "${title.toLowerCase()}" and related keywords`,
        virality: 'Medium - Needs unique angle or emotional hook for organic sharing',
        upsell: 'Unlock additional features and data by creating a free Handshake account',
        dataNeeds: 'To be determined - assess what data sources are needed to deliver value',
        whyItWins: 'Addresses a real pain point in the job search journey. Further analysis needed.',
        reach: 6,
        impact: 6,
        confidence: 5,
        effort: 6
      };
    }

    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Handshake Acquisition Laboratory</h1>
          <p className="text-gray-600">Exploring utility-first value propositions to drive early career job seeker acquisition</p>
          
          {/* Database Status Banner */}
          {!dbConnected && !loading && (
            <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Database Not Connected</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    Ideas will work but won't persist across sessions. Check your browser console for error details.
                  </p>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Most common issues:</strong>
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside mb-3">
                    <li>The <code className="bg-yellow-100 px-1 rounded">ideas</code> table hasn't been created yet (run the SQL below)</li>
                    <li>Row Level Security (RLS) is blocking access (see fix below)</li>
                    <li>Wrong API credentials</li>
                  </ul>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Setup steps:</strong>
                  </p>
                  <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                    <li>In Supabase SQL Editor, run this SQL:
                      <pre className="mt-2 bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
{`CREATE TABLE ideas (
  id BIGINT PRIMARY KEY,
  title TEXT,
  userneed TEXT,
  seoability TEXT,
  virality TEXT,
  upsell TEXT,
  dataneeds TEXT,
  whyitwins TEXT,
  reach INT,
  impact INT,
  confidence INT,
  effort INT,
  hasprototype BOOLEAN DEFAULT false,
  prototypetab INT,
  reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for quick testing (enable it later for production)
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;`}
                      </pre>
                    </li>
                    <li>Refresh this page to test the connection</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          
          {dbConnected && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <Database size={16} />
                <span className="text-sm font-semibold">Database Connected - Ideas will persist</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === index
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading ideas...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Idea Laboratory</h2>
                <p className="text-gray-600">RICE-scored acquisition ideas with transparent decision-making</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                <span>Add Idea</span>
              </button>
            </div>

            {/* Legend */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm text-gray-700">🍚 RICE Scoring Guide</h3>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-semibold">🎯 Reach:</span> How many users will this impact?
                </div>
                <div>
                  <span className="font-semibold">⚡ Impact:</span> How much will it move the needle?
                </div>
                <div>
                  <span className="font-semibold">🔮 Confidence:</span> How sure are we about reach/impact?
                </div>
                <div>
                  <span className="font-semibold">⏱️ Effort:</span> How much work to build? (lower is better)
                </div>
              </div>
              <div className="flex space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#D4EDDA'}}></div>
                  <span>Excellent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#FFF3CD'}}></div>
                  <span>Good</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: '#FFE5D0'}}></div>
                  <span>Needs Work</span>
                </div>
              </div>
            </div>

            {/* Ideas Table */}
            <div className="space-y-3">
              {sortedIdeas.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg mb-2">No ideas yet</p>
                  <p className="text-gray-400 text-sm mb-4">Get started by adding your first idea!</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mx-auto"
                  >
                    <Plus size={20} />
                    <span>Add Your First Idea</span>
                  </button>
                </div>
              ) : (
                sortedIdeas.map((idea) => {
                const riceScore = calculateRICE(idea.reach, idea.impact, idea.confidence, idea.effort);
                const isExpanded = expandedIdea === idea.id;

                return (
                  <div
                    key={idea.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{idea.title}</h3>
                            <div className="flex items-center space-x-3">
                              {idea.hasPrototype && (
                                <button
                                  onClick={() => setActiveTab(idea.prototypeTab)}
                                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink size={14} />
                                  <span>View Prototype</span>
                                </button>
                              )}
                              {!idea.hasPrototype && (
                                <button
                                  onClick={() => handleCreatePrototype(idea)}
                                  disabled={creatingPrototype === idea.id}
                                  className={`flex items-center space-x-1 text-sm font-semibold ${
                                    creatingPrototype === idea.id
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                >
                                  <Plus size={14} />
                                  <span>{creatingPrototype === idea.id ? 'Creating...' : 'Create Prototype'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingIdea(idea);
                                  setNewIdea({
                                    title: idea.title,
                                    userNeed: idea.userNeed,
                                    seoAbility: idea.seoAbility,
                                    virality: idea.virality,
                                    upsell: idea.upsell,
                                    dataNeeds: idea.dataNeeds,
                                    whyItWins: idea.whyItWins,
                                    reach: idea.reach,
                                    impact: idea.impact,
                                    confidence: idea.confidence,
                                    effort: idea.effort
                                  });
                                  setShowAddModal(true);
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{idea.userNeed || 'No description provided'}</p>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-gray-700">🍚 RICE:</span>
                              <span
                                className="px-3 py-1 rounded-full font-bold text-sm"
                                style={{backgroundColor: getRICEColor(riceScore), color: '#333'}}
                              >
                                {riceScore}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 text-sm">
                              <div className="flex items-center space-x-1">
                                <span>🎯</span>
                                <span
                                  className="px-2 py-1 rounded font-semibold"
                                  style={{backgroundColor: getScoreColor(idea.reach, 'reach')}}
                                >
                                  {idea.reach}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>⚡</span>
                                <span
                                  className="px-2 py-1 rounded font-semibold"
                                  style={{backgroundColor: getScoreColor(idea.impact, 'impact')}}
                                >
                                  {idea.impact}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>🔮</span>
                                <span
                                  className="px-2 py-1 rounded font-semibold"
                                  style={{backgroundColor: getScoreColor(idea.confidence, 'confidence')}}
                                >
                                  {idea.confidence}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>⏱️</span>
                                <span
                                  className="px-2 py-1 rounded font-semibold"
                                  style={{backgroundColor: getScoreColor(idea.effort, 'effort')}}
                                >
                                  {idea.effort}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                          className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">💡 Why It Wins</h4>
                            <p className="text-sm text-gray-700 mb-4">{idea.whyItWins || 'Not specified'}</p>

                            <h4 className="font-semibold text-sm text-gray-900 mb-2">🔍 SEO Ability</h4>
                            <p className="text-sm text-gray-700 mb-4">{idea.seoAbility || 'Not specified'}</p>

                            <h4 className="font-semibold text-sm text-gray-900 mb-2">🚀 Virality</h4>
                            <p className="text-sm text-gray-700 mb-4">{idea.virality || 'Not specified'}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">🎣 Upsell/Hook</h4>
                            <p className="text-sm text-gray-700 mb-4">{idea.upsell || 'Not specified'}</p>

                            <h4 className="font-semibold text-sm text-gray-900 mb-2">📊 Data Needs</h4>
                            <p className="text-sm text-gray-700 mb-4">{idea.dataNeeds || 'Not specified'}</p>

                            {idea.reasoning && Object.keys(idea.reasoning).length > 0 && (
                              <>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">🧠 Scoring Rationale</h4>
                                <div className="space-y-2 text-sm">
                                  {idea.reasoning.reach && (
                                    <div>
                                      <span className="font-semibold">🎯 Reach:</span> {idea.reasoning.reach}
                                    </div>
                                  )}
                                  {idea.reasoning.impact && (
                                    <div>
                                      <span className="font-semibold">⚡ Impact:</span> {idea.reasoning.impact}
                                    </div>
                                  )}
                                  {idea.reasoning.confidence && (
                                    <div>
                                      <span className="font-semibold">🔮 Confidence:</span> {idea.reasoning.confidence}
                                    </div>
                                  )}
                                  {idea.reasoning.effort && (
                                    <div>
                                      <span className="font-semibold">⏱️ Effort:</span> {idea.reasoning.effort}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
                })
              )}
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === 1 && <RealityCheckPrototype />}
        {activeTab === 2 && <ResumeRoasterPrototype />}
        {activeTab === 3 && <SalaryCheckPrototype />}
        {activeTab >= 4 && (() => {
          const prototypeIdea = ideas.find(i => i.prototypeTab === activeTab);
          if (prototypeIdea && prototypeIdea.prototypeConfig) {
            return <GenericPrototype idea={prototypeIdea} />;
          }
          return <div className="bg-white rounded-lg shadow-lg p-8">Prototype not found</div>;
        })()}
      </div>

      {/* Add Idea Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingIdea ? 'Edit Idea' : 'Add New Idea'}</h2>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingIdea(null);
                }} className="p-2 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold">Title</label>
                    {!editingIdea && (
                      <button
                        onClick={handleAutoFill}
                        disabled={!newIdea.title || autoFilling}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {autoFilling ? '✨ AI filling...' : '✨ AI Auto-fill'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newIdea.title}
                    onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Job Market Health Tracker"
                  />
                  {!editingIdea && (
                    <p className="text-xs text-gray-500 mt-1">💡 Enter a title and click "AI Auto-fill" to generate all fields automatically</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">User Need / Problem Solved</label>
                  <textarea
                    value={newIdea.userNeed}
                    onChange={(e) => setNewIdea({...newIdea, userNeed: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="What problem does this solve?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">SEO Ability</label>
                  <input
                    type="text"
                    value={newIdea.seoAbility}
                    onChange={(e) => setNewIdea({...newIdea, seoAbility: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="What keywords? Search volume?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Virality Potential</label>
                  <input
                    type="text"
                    value={newIdea.virality}
                    onChange={(e) => setNewIdea({...newIdea, virality: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Why would people share this?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Upsell/Hook</label>
                  <input
                    type="text"
                    value={newIdea.upsell}
                    onChange={(e) => setNewIdea({...newIdea, upsell: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="What's unlocked with an account?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Data Needs</label>
                  <input
                    type="text"
                    value={newIdea.dataNeeds}
                    onChange={(e) => setNewIdea({...newIdea, dataNeeds: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="What data is required?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Why It Wins</label>
                  <textarea
                    value={newIdea.whyItWins}
                    onChange={(e) => setNewIdea({...newIdea, whyItWins: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Key insight or strategic advantage"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">🎯 Reach (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newIdea.reach}
                      onChange={(e) => setNewIdea({...newIdea, reach: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">⚡ Impact (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newIdea.impact}
                      onChange={(e) => setNewIdea({...newIdea, impact: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">🔮 Confidence (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newIdea.confidence}
                      onChange={(e) => setNewIdea({...newIdea, confidence: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">⏱️ Effort (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newIdea.effort}
                      onChange={(e) => setNewIdea({...newIdea, effort: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingIdea(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddIdea}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingIdea ? 'Update Idea' : 'Add Idea'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Prototype Components
const RealityCheckPrototype = () => {
  const [salary, setSalary] = useState(75000);
  const [city, setCity] = useState('san-francisco');
  const [results, setResults] = useState<any>(null);

  const cities = [
    { id: 'san-francisco', name: 'San Francisco, CA', col: 180, rent: 3200, avgSalary: 95000 },
    { id: 'new-york', name: 'New York, NY', col: 170, rent: 3000, avgSalary: 85000 },
    { id: 'austin', name: 'Austin, TX', col: 120, rent: 1800, avgSalary: 75000 },
    { id: 'chicago', name: 'Chicago, IL', col: 115, rent: 1600, avgSalary: 70000 },
    { id: 'denver', name: 'Denver, CO', col: 125, rent: 1900, avgSalary: 72000 },
    { id: 'seattle', name: 'Seattle, WA', col: 155, rent: 2400, avgSalary: 90000 }
  ];

  const selectedCity = cities.find(c => c.id === city);

  const calculate = () => {
    const monthlyIncome = salary / 12;
    const rent = selectedCity!.rent;
    const utilities = 150;
    const groceries = 400;
    const transportation = 200;
    const healthcare = 300;
    const entertainment = 200;
    const savings = 500;
    
    const totalExpenses = rent + utilities + groceries + transportation + healthcare + entertainment + savings;
    const leftover = monthlyIncome - totalExpenses;
    const rentPercent = (rent / monthlyIncome) * 100;
    
    setResults({
      monthlyIncome,
      rent,
      totalExpenses,
      leftover,
      rentPercent,
      utilities,
      groceries,
      transportation,
      healthcare,
      entertainment,
      savings
    });
  };

  useEffect(() => {
    calculate();
  }, [salary, city]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-2">📊 Reality Check Calculator</h2>
      <p className="text-gray-600 mb-8">Can you actually afford to live there? Let's find out.</p>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-sm font-semibold mb-2">Your Salary Offer</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(parseInt(e.target.value))}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold"
          />
          <p className="text-sm text-gray-500 mt-1">${(salary / 12).toLocaleString()}/month</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Target City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg"
          >
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Cost of Living Index: {selectedCity!.col}</p>
        </div>
      </div>

      {results && (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg ${results.leftover > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-xl font-bold mb-2">
              {results.leftover > 0 ? '✅ You can make it work!' : '⚠️ This might be tight...'}
            </h3>
            <p className="text-3xl font-bold mb-2">
              ${Math.abs(results.leftover).toLocaleString()}/month {results.leftover > 0 ? 'left over' : 'short'}
            </p>
            <p className="text-sm text-gray-600">
              Rent is {results.rentPercent.toFixed(1)}% of your income
              {results.rentPercent > 30 && ' (⚠️ experts recommend max 30%)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Monthly Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>🏠 Rent</span>
                  <span className="font-semibold">${results.rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>⚡ Utilities</span>
                  <span className="font-semibold">${results.utilities}</span>
                </div>
                <div className="flex justify-between">
                  <span>🛒 Groceries</span>
                  <span className="font-semibold">${results.groceries}</span>
                </div>
                <div className="flex justify-between">
                  <span>🚗 Transportation</span>
                  <span className="font-semibold">${results.transportation}</span>
                </div>
                <div className="flex justify-between">
                  <span>🏥 Healthcare</span>
                  <span className="font-semibold">${results.healthcare}</span>
                </div>
                <div className="flex justify-between">
                  <span>🎉 Entertainment</span>
                  <span className="font-semibold">${results.entertainment}</span>
                </div>
                <div className="flex justify-between">
                  <span>💰 Savings</span>
                  <span className="font-semibold">${results.savings}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total Expenses</span>
                  <span>${results.totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">💡 Reality Check Insights</h4>
              <div className="space-y-3 text-sm">
                <p>
                  🎯 <strong>Avg salary</strong> in {selectedCity!.name}: ${selectedCity!.avgSalary.toLocaleString()}
                </p>
                <p>
                  🏡 You're looking at <strong>{((results.rent / selectedCity!.avgSalary * 12) * 100).toFixed(0)}%</strong> of annual income on rent
                </p>
                {results.leftover < 0 && (
                  <p className="text-red-700">
                    💸 Consider roommates or look at neighborhoods farther from downtown
                  </p>
                )}
                {results.leftover > 1000 && (
                  <p className="text-green-700">
                    ✨ You'll have comfortable breathing room for student loans and fun
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold mb-2">🔓 Want the full picture?</h4>
            <p className="text-sm text-gray-700 mb-4">
              Create a free Handshake account to see real salary offers from companies hiring in {selectedCity!.name}, 
              plus cost breakdowns from alumni actually living there.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Unlock Real Salary Data →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ResumeRoasterPrototype = () => {
  const [resume, setResume] = useState('');
  const [roast, setRoast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'paste' | 'upload'>('paste');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    setResume('');
    setRoast(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-resume-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse file');
      }

      const data = await response.json();
      setResume(data.text);
      setUploadMethod('paste'); // Switch to paste view to show the extracted text
    } catch (error: any) {
      console.error('Error parsing file:', error);
      alert(`Failed to parse file: ${error.message}`);
    } finally {
      setParsingFile(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const generateRoast = async () => {
    if (!resume.trim()) return;
    
    setLoading(true);
    setRoast(null);
    
    try {
      const response = await fetch('/api/roast-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: resume,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roast');
      }

      const roastData = await response.json();
      setRoast(roastData);
    } catch (error: any) {
      console.error('Error generating roast:', error);
      alert(`Failed to generate roast: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-2">🔥 Resume Roaster</h2>
      <p className="text-gray-600 mb-8">Honest feedback that doesn't sugarcoat. Your resume deserves better.</p>

      <div className="mb-6">
        {/* Toggle between paste and upload */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setUploadMethod('paste')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              uploadMethod === 'paste'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📝 Paste Text
          </button>
          <button
            onClick={() => setUploadMethod('upload')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              uploadMethod === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📄 Upload File
          </button>
        </div>

        {uploadMethod === 'paste' ? (
          <div>
            <label className="block text-sm font-semibold mb-2">Paste Your Resume (or just the work experience section)</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-48"
              placeholder="Marketing Intern | TechCorp | Summer 2023
- Responsible for managing social media accounts
- Collaborated with team members on various projects
- Helped with content creation and analytics

[Paste your resume text here...]"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold mb-2">Upload Your Resume</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={parsingFile}
              />
              <label
                htmlFor="resume-upload"
                className={`cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${
                  parsingFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {parsingFile ? '📄 Parsing file...' : '📄 Choose File'}
              </label>
              <p className="text-sm text-gray-500 mt-3">
                Supported formats: PDF, DOCX, DOC, TXT
              </p>
              {parsingFile && (
                <p className="text-sm text-blue-600 mt-2">Extracting text from your file...</p>
              )}
            </div>
            {resume && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Extracted Text (you can edit this):</p>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-48"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={generateRoast}
        disabled={!resume || loading}
        className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-6"
      >
        {loading ? '🔥 Roasting your resume...' : '🔥 Roast My Resume'}
      </button>

      {roast && (
        <div className="space-y-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">The Roast</h3>
              <span className="text-4xl font-bold text-red-600">{roast.grade}</span>
            </div>
            <p className="text-gray-800 leading-relaxed">{roast.roast}</p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">🛠️ How to Fix It</h3>
            <div className="space-y-4">
              {roast.fixes.map((fix: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-2">{fix.problem}</p>
                  <p className="text-sm text-green-700 font-semibold">{fix.fix}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">✨ What You Got Right</h3>
            <div className="space-y-2">
              {roast.strengths.map((strength: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-700">{strength}</p>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2">📋 Next Steps</h3>
            <p className="text-sm text-gray-700">{roast.nextSteps}</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold mb-2">🎯 Ready to put this resume to work?</h4>
            <p className="text-sm text-gray-700 mb-4">
              Create a free Handshake account to get matched with jobs that actually value your (improved) skills. 
              Our AI shows you where your resume stands out from the crowd.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Find Jobs That Want You →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SalaryCheckPrototype = () => {
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [experience, setExperience] = useState('0-1');
  const [location, setLocation] = useState('san-francisco');
  const [currentSalary, setCurrentSalary] = useState(85000);
  const [results, setResults] = useState<any>(null);

  const locations = [
    { id: 'san-francisco', name: 'San Francisco', multiplier: 1.3 },
    { id: 'new-york', name: 'New York', multiplier: 1.2 },
    { id: 'seattle', name: 'Seattle', multiplier: 1.15 },
    { id: 'austin', name: 'Austin', multiplier: 1.0 },
    { id: 'chicago', name: 'Chicago', multiplier: 0.95 }
  ];

  const jobTitles = [
    { title: 'Software Engineer', base: 95000 },
    { title: 'Product Manager', base: 100000 },
    { title: 'Data Analyst', base: 75000 },
    { title: 'Marketing Manager', base: 80000 },
    { title: 'UX Designer', base: 85000 }
  ];

  const checkSalary = () => {
    const job = jobTitles.find(j => j.title === jobTitle);
    const loc = locations.find(l => l.id === location);
    const expMultiplier = experience === '0-1' ? 1 : experience === '2-3' ? 1.15 : 1.3;
    
    const marketRate = job!.base * loc!.multiplier * expMultiplier;
    const percentile25 = marketRate * 0.85;
    const percentile75 = marketRate * 1.15;
    const difference = currentSalary - marketRate;
    const percentDiff = (difference / marketRate) * 100;
    
    let verdict = '';
    let color = '';
    if (percentDiff < -15) {
      verdict = 'Significantly Underpaid 😬';
      color = 'red';
    } else if (percentDiff < -5) {
      verdict = 'Below Market 📉';
      color = 'orange';
    } else if (percentDiff < 5) {
      verdict = 'Fair Market Rate ✅';
      color = 'green';
    } else {
      verdict = 'Above Market 🎉';
      color = 'blue';
    }
    
    setResults({
      marketRate,
      percentile25,
      percentile75,
      difference,
      percentDiff,
      verdict,
      color
    });
  };

  useEffect(() => {
    checkSalary();
  }, [jobTitle, experience, location, currentSalary]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-2">💰 Am I Being Underpaid?</h2>
      <p className="text-gray-600 mb-8">Find out if you're getting paid fairly. The truth might surprise you.</p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold mb-2">Job Title</label>
          <select
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
          >
            {jobTitles.map(j => (
              <option key={j.title} value={j.title}>{j.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Years of Experience</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
          >
            <option value="0-1">0-1 years</option>
            <option value="2-3">2-3 years</option>
            <option value="4+">4+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
          >
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Your Current/Offered Salary</label>
          <input
            type="number"
            value={currentSalary}
            onChange={(e) => setCurrentSalary(parseInt(e.target.value))}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
          />
        </div>
      </div>

      {results && (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg ${
            results.color === 'red' ? 'bg-red-50 border-2 border-red-200' :
            results.color === 'orange' ? 'bg-orange-50 border-2 border-orange-200' :
            results.color === 'green' ? 'bg-green-50 border-2 border-green-200' :
            'bg-blue-50 border-2 border-blue-200'
          }`}>
            <h3 className="text-2xl font-bold mb-4">{results.verdict}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Salary</p>
                <p className="text-2xl font-bold">${currentSalary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Market Average</p>
                <p className="text-2xl font-bold">${Math.round(results.marketRate).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-lg">
                You're making <strong>{Math.abs(results.percentDiff).toFixed(1)}% {results.difference < 0 ? 'below' : 'above'}</strong> market rate
                {results.difference < 0 && ` — that's $${Math.abs(results.difference).toLocaleString()} less than you should be making`}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📊 Salary Range</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">25th Percentile</span>
                  <span className="font-semibold">${Math.round(results.percentile25).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-400 h-3 rounded-full" style={{width: '25%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Market Average</span>
                  <span className="font-semibold">${Math.round(results.marketRate).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-400 h-3 rounded-full" style={{width: '50%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">75th Percentile</span>
                  <span className="font-semibold">${Math.round(results.percentile75).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-400 h-3 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {results.difference < 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold mb-2">💡 What You Can Do</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Use this data in your next salary negotiation</li>
                <li>✅ Look for companies that pay market rate or above</li>
                <li>✅ Consider switching roles - you could be leaving ${Math.abs(results.difference).toLocaleString()} on the table annually</li>
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold mb-2">🔓 Want to see more?</h4>
            <p className="text-sm text-gray-700 mb-4">
              Create a free Handshake account to see actual salary offers + interview details from 500+ companies hiring 
              {jobTitle}s in {locations.find(l => l.id === location)!.name}. Real data from real offers.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Unlock Company Salary Data →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GenericPrototype = ({ idea }: { idea: any }) => {
  const config = idea.prototypeConfig;
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [outputs, setOutputs] = useState<Record<string, any>>({});

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">Prototype configuration not found.</p>
      </div>
    );
  }

  const handleInputChange = (id: string, value: any) => {
    setInputValues({ ...inputValues, [id]: value });
  };

  const calculateOutputs = () => {
    const calculated: Record<string, any> = {};
    const calc = config.calculation;
    
    if (!calc) {
      // Fallback if no calculation provided
      config.outputs?.forEach((output: any) => {
        calculated[output.id] = 'No calculation defined';
      });
      setOutputs(calculated);
      return;
    }
    
    // Helper to safely evaluate expressions
    const safeEval = (expression: string, inputs: Record<string, any>): any => {
      try {
        // Replace input IDs with their values
        let expr = expression;
        Object.keys(inputs).forEach(inputId => {
          const value = inputs[inputId];
          if (value === null || value === undefined || value === '') {
            return; // Skip empty inputs
          }
          // Replace input IDs with their actual values
          const regex = new RegExp(`\\b${inputId}\\b`, 'g');
          if (typeof value === 'string') {
            expr = expr.replace(regex, `"${value.replace(/"/g, '\\"')}"`);
          } else {
            expr = expr.replace(regex, String(value));
          }
        });
        
        // Use Function constructor for safer evaluation
        // This is still somewhat risky but better than eval
        return new Function('return ' + expr)();
      } catch (e) {
        console.error('Error evaluating expression:', expression, 'with inputs:', inputs, e);
        return null;
      }
    };
    
    // Process each output - use the first output's calculation for now
    // In the future, each output could have its own calculation
    config.outputs?.forEach((output: any, index: number) => {
      // Check if calculation is a string (old format) or object (new format)
      if (typeof calc === 'string') {
        // Old format: just a description - try to infer logic
        const desc = calc.toLowerCase();
        const nums = Object.values(inputValues).filter(v => typeof v === 'number' && v !== null && v !== undefined);
        
        if (desc.includes('multiply') || desc.includes('times') || desc.includes('x')) {
          calculated[output.id] = nums.length > 0 ? nums.reduce((a, b) => a * b, 1).toLocaleString() : 'Enter numbers';
        } else if (desc.includes('add') || desc.includes('sum') || desc.includes('plus') || desc.includes('+')) {
          calculated[output.id] = nums.length > 0 ? nums.reduce((a, b) => a + b, 0).toLocaleString() : 'Enter numbers';
        } else if (desc.includes('divide') || desc.includes('per') || desc.includes('/')) {
          calculated[output.id] = nums.length >= 2 && nums[1] !== 0 ? (nums[0] / nums[1]).toFixed(2) : 'Enter two numbers';
        } else if (desc.includes('subtract') || desc.includes('minus') || desc.includes('-')) {
          calculated[output.id] = nums.length >= 2 ? (nums[0] - nums[1]).toLocaleString() : 'Enter two numbers';
        } else {
          calculated[output.id] = 'Calculation: ' + calc;
        }
      } else if (calc && typeof calc === 'object') {
        // New format: structured calculation
        if (calc.type === 'formula' && calc.formula) {
          const result = safeEval(calc.formula, inputValues);
          calculated[output.id] = result !== null && result !== undefined 
            ? (typeof result === 'number' ? (Number.isInteger(result) ? result.toLocaleString() : result.toFixed(2)) : String(result))
            : 'Invalid calculation - check inputs';
        } else if (calc.type === 'conditional' && calc.conditions) {
          let result = null;
          for (const condition of calc.conditions) {
            const conditionResult = safeEval(condition.if, inputValues);
            if (conditionResult) {
              result = safeEval(condition.then, inputValues);
              break;
            }
          }
          calculated[output.id] = result !== null && result !== undefined
            ? (typeof result === 'number' ? result.toLocaleString() : String(result))
            : 'No condition matched';
        } else if (calc.description) {
          // Fallback to description parsing
          const desc = calc.description.toLowerCase();
          const nums = Object.values(inputValues).filter(v => typeof v === 'number');
          if (desc.includes('multiply') || desc.includes('times')) {
            calculated[output.id] = nums.length > 0 ? nums.reduce((a, b) => a * b, 1).toLocaleString() : 'Enter numbers';
          } else if (desc.includes('add') || desc.includes('sum')) {
            calculated[output.id] = nums.length > 0 ? nums.reduce((a, b) => a + b, 0).toLocaleString() : 'Enter numbers';
          } else {
            calculated[output.id] = calc.description;
          }
        } else {
          calculated[output.id] = 'No calculation logic available';
        }
      } else {
        calculated[output.id] = 'No calculation defined';
      }
    });
    
    setOutputs(calculated);
  };

  useEffect(() => {
    if (Object.keys(inputValues).length > 0) {
      calculateOutputs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValues]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-2">{config.title || idea.title}</h2>
      <p className="text-gray-600 mb-8">{config.description || idea.userNeed}</p>

      <div className="space-y-6">
        {/* Inputs */}
        {config.inputs && config.inputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Inputs</h3>
            {config.inputs.map((input: any) => (
              <div key={input.id}>
                <label className="block text-sm font-semibold mb-2">{input.label}</label>
                {input.type === 'select' ? (
                  <select
                    value={inputValues[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
                  >
                    <option value="">Select...</option>
                    {input.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : input.type === 'textarea' ? (
                  <textarea
                    value={inputValues[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    placeholder={input.placeholder}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-32"
                  />
                ) : (
                  <input
                    type={input.type}
                    value={inputValues[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, input.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={input.placeholder}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Outputs */}
        {config.outputs && config.outputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Results</h3>
            {config.outputs.map((output: any) => (
              <div key={output.id} className="border rounded-lg p-4">
                <label className="block text-sm font-semibold mb-2">{output.label}</label>
                <div className="text-lg">
                  {outputs[output.id] || 'Enter inputs above to see results'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upsell */}
        {config.upsellMessage && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
            <h4 className="font-semibold mb-2">🔓 {idea.upsell || config.upsellMessage}</h4>
            <p className="text-sm text-gray-700 mb-4">
              {idea.upsell || config.upsellMessage}
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Unlock Full Features →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
