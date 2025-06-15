import React, { useState, useCallback } from 'react';
import { Upload, FileText, Zap, Leaf, Calculator, Settings, Info } from 'lucide-react';

interface ParsedResults {
  totalWords: number;
  totalTokens: number;
  co2Emissions: number;
  waterConsumption: number;
  conversationCount: number;
  messageCount: number;
}

function App() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ParsedResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [co2Factor, setCo2Factor] = useState(20); // g CO2 per 1000 tokens
  const [fileName, setFileName] = useState<string>('');
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);

  // Close tooltips when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if the click is outside tooltip content and not on a tooltip trigger button
      if (!target.closest('.tooltip-content') && !target.closest('.tooltip-trigger')) {
        setActiveTooltip(null);
      }
    };

    if (activeTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTooltip]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const parseJsonFile = async (file: File): Promise<ParsedResults> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          let totalWords = 0;
          let conversationCount = 0;
          let messageCount = 0;

          // Handle array of conversations or single conversation
          const conversations = Array.isArray(jsonData) ? jsonData : [jsonData];

          conversations.forEach((conversation) => {
            if (!conversation.mapping) return;
            
            conversationCount++;
            
            Object.values(conversation.mapping).forEach((node: any) => {
              if (node.message && 
                  node.message.author && 
                  node.message.author.role === 'assistant' &&
                  node.message.content &&
                  node.message.content.parts) {
                
                messageCount++;
                
                // Extract text from parts array
                const parts = node.message.content.parts;
                if (Array.isArray(parts)) {
                  parts.forEach((part: string) => {
                    if (typeof part === 'string') {
                      totalWords += countWords(part);
                    }
                  });
                }
              }
            });
          });

          // Convert words to tokens (1 token ≈ 0.75 words)
          const totalTokens = Math.round(totalWords / 0.75);
          
          // Calculate CO2 emissions
          const co2Emissions = (totalTokens / 1000) * co2Factor / 1000; // Convert grams to kg for display

          // Calculate water consumption (0.32 ml per response)
          const waterConsumption = messageCount * 0.32; // ml

          resolve({
            totalWords,
            totalTokens,
            co2Emissions,
            waterConsumption,
            conversationCount,
            messageCount
          });
        } catch (err) {
          reject(new Error('Fichier JSON invalide ou format inattendu'));
        }
      };
      
      reader.onerror = () => reject(new Error('Échec de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setResults(null);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));

    if (!jsonFile) {
      setError('Veuillez déposer un fichier .json valide');
      return;
    }

    setFileName(jsonFile.name);
    setIsProcessing(true);

    try {
      const parsedResults = await parseJsonFile(jsonFile);
      setResults(parsedResults);
      // Scroll to results after a short delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'analyse du fichier');
    } finally {
      setIsProcessing(false);
    }
  }, [co2Factor]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResults(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const parsedResults = await parseJsonFile(file);
      setResults(parsedResults);
      // Scroll to results after a short delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'analyse du fichier');
    } finally {
      setIsProcessing(false);
    }
  }, [co2Factor]);

  // Recalculate CO2 when factor changes
  React.useEffect(() => {
    if (results) {
      const newCo2Emissions = (results.totalTokens / 1000) * co2Factor / 1000; // Convert grams to kg
      setResults(prev => prev ? { ...prev, co2Emissions: newCo2Emissions } : null);
    }
  }, [co2Factor, results?.totalTokens]);

  const toggleTooltip = (tooltipId: string) => {
    setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Privacy Banner */}
      <div className="bg-blue-600 text-white py-3 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium">
            ☝️ Ce site ne stocke EN THÉORIE aucune donnée personnelle (voir pied de page pour plus d'informations)
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-3">
              <span className="text-3xl">💨</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Calculateur CO₂ ChatGPT</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Calculez l'empreinte carbone approximative de l'intégralité des conversations de votre compte ChatGPT en analysant votre historique de chat exporté
          </p>
        </div>

        {/* Zone de téléchargement */}
        <div className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${isDragOver 
                ? 'border-green-500 bg-green-50 scale-105' 
                : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
              }
              ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
            `}
          >
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Traitement de votre fichier...</p>
                  <p className="text-gray-500">Analyse des conversations et calcul des émissions</p>
                </>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Glissez-déposez votre fichier d'export ChatGPT ici (conversations.json)
                  </p>
                  <p className="text-gray-500 mb-4">
                    ou cliquez ici pour charger le fichier
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Exemple de résultat */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Un exemple de résultat pour un compte ChatGPT utilisé fréquemment durant un peu plus de 2 ans et demi entre Novembre 2022 et Juin 2025</h3>
          <button
            onClick={() => setShowExampleModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center mx-auto"
          >
            <span className="mr-2">👁️</span>
            Voir l'exemple
          </button>
        </div>

        {/* Modal pour l'exemple */}
        {showExampleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto relative">
              <button
                onClick={() => setShowExampleModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
              >
                ×
              </button>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pr-8">
                  Exemple de résultat pour un compte ChatGPT utilisé fréquemment durant un peu plus de 2 ans et demi entre Novembre 2022 et Juin 2025
                </h3>
                <div className="flex justify-center">
                  <img 
                    src="https://i.ibb.co/4R8Z56Ps/Exemple-conso-Chat-GPT.png" 
                    alt="Exemple de résultat du calculateur CO2 ChatGPT montrant 938 501 mots, 1 251 335 tokens, 12.513 kg de CO2 et 2.10 L d'eau consommée"
                    className="max-w-full h-auto rounded-lg shadow-sm border border-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tutoriel d'export */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Comment exporter vos données ChatGPT ?</h3>
          <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
            <li>En cliquant sur la pastille ronde en haut à droite de votre compte &gt; puis en vous rendant dans "Paramètres"</li>
            <li>Dans la fenêtre qui s'affiche, cliquez sur "Gestion des données"</li>
            <li>Votre export est annoncé pour arriver sous 24h dans votre boîte email. En pratique, il devrait arriver en quelques minutes. Vous recevrez une notification par mail. Dépêchez-vous, vous n'avez que 24h pour télécharger vos données via ce lien.</li>
            <li>Une fois disponible, téléchargez-le et dézippez le dossier contenant votre historique.</li>
            <li>Dans le dossier dézippé, récupérez le fichier conversation.json et glissez-déposez-le ou chargez-le dans la zone ci-dessus.</li>
          </ol>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-600 font-medium">Erreur : {error}</p>
          </div>
        )}

        {/* Affichage des résultats */}
        {results && (
          <div ref={resultsRef} className="space-y-6">
            <>
            {/* Informations du fichier */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Analyse du fichier</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fichier</p>
                  <p className="font-medium text-gray-800 truncate">{fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conversations</p>
                  <p className="font-medium text-gray-800">{results.conversationCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Messages de l'assistant</p>
                  <p className="font-medium text-gray-800">{results.messageCount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Résultats principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Mots */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-3">
                  <FileText className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Total des mots</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {results.totalWords.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Générés par l'assistant ChatGPT
                </p>
              </div>

              {/* Tokens */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-3">
                  <Zap className="w-6 h-6 text-amber-500 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Tokens estimés</h3>
                </div>
                <p className="text-3xl font-bold text-amber-600 mb-2">
                  {results.totalTokens.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  ~{(results.totalWords / results.totalTokens).toFixed(2)} mots par token
                </p>
              </div>

              {/* Émissions CO2 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-3 rounded-full mr-3">
                    <span className="text-2xl">💨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Émissions CO₂</h3>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {results.co2Emissions.toFixed(3)} kg
                </p>
                <p className="text-sm text-gray-500">
                  Impact environnemental approximatif
                </p>
                <button
                  onClick={() => toggleTooltip('co2')}
                  className="tooltip-trigger absolute bottom-3 right-3 p-1 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {activeTooltip === 'co2' && (
                  <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                    Calcul : {results.totalTokens.toLocaleString()} tokens ÷ 1000 × {co2Factor}g ÷ 1000 = {results.co2Emissions.toFixed(3)} kg CO₂
                    <br /><br />
                    Les émissions CO₂ calculées ici dépendent du Facteur d'émission en bas de la page que vous pouvez faire évoluer.
                  </div>
                )}
              </div>

              {/* Consommation d'eau */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <span className="text-2xl">💧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Eau consommée</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {results.waterConsumption >= 1000 
                    ? `${(results.waterConsumption / 1000).toFixed(2)} L`
                    : `${results.waterConsumption.toFixed(1)} ml`
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Pour le refroidissement des serveurs, soit {(results.waterConsumption / 1000 / 10).toFixed(1)} min sous la douche (à 10L/min)
                </p>
                <button
                  onClick={() => toggleTooltip('water')}
                  className="tooltip-trigger absolute bottom-3 right-3 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {activeTooltip === 'water' && (
                  <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                    Calcul : {results.messageCount} messages × 0,32 ml = {results.waterConsumption.toFixed(1)} ml
                    <br />Base : 0,32 ml d'eau par requête ChatGPT
                    <br />Source : <a href="https://www.lesnumeriques.com/intelligence-artificielle/un-quinzieme-de-cuillere-a-cafe-l-etrange-aveu-de-sam-altman-sur-l-impact-ecologique-de-chatgpt-n238063.html" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Les Numériques - Impact écologique ChatGPT</a>
                  </div>
                )}
              </div>
            </div>

            {/* Contexte environnemental */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8">
              <div className="flex items-center mb-3">
                <Calculator className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-2xl font-bold text-green-800">Équivalents environnementaux</h3>
              </div>
              <p className="text-green-700 mb-6 text-lg">
                Votre empreinte carbone ChatGPT équivaut à :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Voiture */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-3">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Voiture essence</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('car')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {(results.co2Emissions * 10).toFixed(1)} km
                  </p>
                  <p className="text-sm text-gray-500">parcourus</p>
                  {activeTooltip === 'car' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.co2Emissions.toFixed(3)} kg CO₂ × 10 km/kg = {(results.co2Emissions * 10).toFixed(1)} km
                      <br />Base : 100g CO₂/km pour une voiture essence moyenne
                      <br />Source : <a href="https://carlabelling.ademe.fr/chiffrescles/r/moyenneEmissionCo2Gamme" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">ADEME</a>
                    </div>
                  )}
                </div>

                {/* Viande */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full mr-3">
                      <span className="text-2xl">🐄</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Entrecôtes</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('meat')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-1">
                    {(results.co2Emissions / 28 * 1000 / 300).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">de 300g chacune</p>
                  {activeTooltip === 'meat' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.co2Emissions.toFixed(3)} kg CO₂ ÷ 28 kg CO₂/kg bœuf × 1000g ÷ 300g = {(results.co2Emissions / 28 * 1000 / 300).toFixed(1)} entrecôtes
                      <br />Base : 28 kg CO₂ par kg de bœuf
                      <br />Source : <a href="https://impactco2.fr/outils/alimentation/boeuf" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Impact CO₂</a>
                    </div>
                  )}
                </div>

                {/* Streaming */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-3 rounded-full mr-3">
                      <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">N</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Streaming sur une télé</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('streaming')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 mb-1">
                    {(results.co2Emissions / 0.07).toFixed(1)}h
                  </p>
                  <p className="text-sm text-gray-500">
                    soit {((results.co2Emissions / 0.07) / 2).toFixed(1)} films de 2h
                  </p>
                  {activeTooltip === 'streaming' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.co2Emissions.toFixed(3)} kg CO₂ ÷ 0,07 kg CO₂/h = {(results.co2Emissions / 0.07).toFixed(1)}h
                      <br />Base : 70g CO₂ par heure de streaming 4K
                      <br />Source : <a href="https://impactco2.fr/outils/usagenumerique/streamingvideo" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Impact CO₂</a>
                    </div>
                  )}
                </div>

                {/* Avion */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-sky-100 p-3 rounded-full mr-3">
                      <span className="text-2xl">✈️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Distance en avion</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('plane')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-sky-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-sky-600 mb-1">
                    {(results.co2Emissions / 0.259).toFixed(1)} km
                  </p>
                  <p className="text-sm text-gray-500">parcourus</p>
                  {activeTooltip === 'plane' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.co2Emissions.toFixed(3)} kg CO₂ ÷ 0,259 kg CO₂/km = {(results.co2Emissions / 0.259).toFixed(1)} km
                      <br />Base : 259g CO₂ par km de vol (court courrier)
                      <br />Source : <a href="https://impactco2.fr/outils/transport/avion-courtcourrier" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Impact CO₂</a>
                    </div>
                  )}
                </div>

                {/* Séries TV */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 p-3 rounded-full mr-3">
                      <span className="text-2xl">📺</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Saisons de série</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('series')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-indigo-600 mb-1">
                    {((results.co2Emissions / 0.07) / 8).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">de 8 épisodes d'1h</p>
                  {activeTooltip === 'series' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.co2Emissions.toFixed(3)} kg CO₂ ÷ 0,07 kg CO₂/h ÷ 8h = {((results.co2Emissions / 0.07) / 8).toFixed(1)} saisons
                      <br />Base : 70g CO₂/h de streaming × 8h par saison
                      <br />Source : <a href="https://impactco2.fr/outils/usagenumerique/streamingvideo" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Impact CO₂</a>
                    </div>
                  )}
                </div>

                {/* Électricité */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full mr-3">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Consommation électrique</h4>
                    </div>
                    <button
                      onClick={() => toggleTooltip('electricity')}
                      className="tooltip-trigger ml-auto p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 mb-1">
                    {(results.messageCount * 0.34 / 1000).toFixed(2)} kWh
                  </p>
                  <p className="text-sm text-gray-500">d'électricité française</p>
                  {activeTooltip === 'electricity' && (
                    <div className="tooltip-content absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                      Calcul : {results.messageCount} messages × 0,34 Wh ÷ 1000 = {(results.messageCount * 0.34 / 1000).toFixed(2)} kWh
                      <br />Base : 0,34 Wh par message ChatGPT
                      <br />Source : <a href="https://blog.samaltman.com/the-gentle-singularity" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Blog Sam Altman</a>
                    </div>
                  )}
                </div>


              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
            {/* Paramètres du facteur CO2 - affiché après chargement */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Facteur d'émission</h3>
              </div>
              <div className="relative">
                <button
                  onClick={() => toggleTooltip('co2-factor')}
                  className="tooltip-trigger p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {activeTooltip === 'co2-factor' && (
                  <div className="tooltip-content absolute top-full right-0 mt-2 w-80 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                    <p className="mb-2">
                      <strong>Source pour 20g CO₂/1000 tokens :</strong>
                    </p>
                    <p className="mb-2">
                      Cette valeur semble équilibrée selon diverses estimations, même si ChatGPT/OpenAI ne communique pas clairement sur ces données.
                    </p>
                    <p>
                      Référence : <a href="https://chatgpt.com/share/684e9feb-7da8-8002-9547-6c00978f5de5" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Discussion ChatGPT sur les estimations CO₂</a>
                    </p>
                    <p>
                      Consommation énergétique : <a href="https://blog.samaltman.com/the-gentle-singularity" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Blog Sam Altman</a> (0,34 Wh et 0,32ml d'eau par requête)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Le facteur d'émission indiqué par défaut est de {co2Factor} grammes de CO₂ pour 1000 tokens (environ 750 mots) avec ChatGPT, ce qui semble plutôt être une fourchette haute. Faites-le évoluer à la hausse ou à la baisse pour voir l'impact sur les résultats.
            </p>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                CO₂ par 1 000 tokens (g) :
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={co2Factor}
                onChange={(e) => setCo2Factor(parseFloat(e.target.value) || 10)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">
                (Basé sur les estimations de consommation énergétique pour l'inférence de modèles IA)
              </span>
            </div>
          </div>
            </>
          </div>
        )}

        {/* À propos du calculateur */}
        <section className="prose prose-lg max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">À propos du calculateur</h2>

          <p>
            Ce calculateur fonctionne entièrement dans votre navigateur.
          </p>

          <p>
            Lors de cette analyse, <strong>aucune de vos données personnelles n'est censée être téléchargée ni stockée en ligne</strong>. Si je n'en ai pas l'assurance complète, c'est que je ne suis pas développeur. C'est un outil - Bolt.new qui a créé le code et, même si je lui ai demandé à l'outil de ne rien stocker et en ligne et qu'il me l'a confirmé à l'écrit plusieurs fois, je n'estime pas avoir les compétences suffisantes pour l'auditer de façon sérieuse.
            Si vous en doutez, vous pouvez auditer ou exécuter le code vous-même sur : 
            <a href="https://github.com/mamatdunet/chatgptco2" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              github.com/mamatdunet/chatgptco2
            </a>.
          </p>

          <p>
            Vous pouvez aussi tester cela : chargez le site, coupez Internet, puis lancez l'analyse. Elle fonctionnera toujours.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Côté calcul</h3>

          <p>
            Les résultats sont estimatifs, issus de <strong>sources diverses</strong> – les données exactes d'OpenAI étant rarement rendues publiques. Une fois votre fichier importé, cliquez sur le petit "i" à côté de chaque équivalence pour en savoir plus sur le mode de calcul et les sources utilisés à ce propos.
            Les émissions réelles peuvent varier selon le mix énergétique utilisé (ici : hypothèse basée sur l'électricité française).
          </p>

          <p>
            <strong>À noter :</strong> ce calculateur ne prend en compte que les <em>conversations textuelles</em> de votre historique.
            Il ne mesure pas l'impact CO₂ des images ou vidéos générées avec ChatGPT.
          </p>

          <p>
            À titre indicatif, <strong>une image générée</strong> représenterait environ <strong>2g de CO₂</strong> selon 
            <a href="https://arxiv.org/pdf/2311.16863" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              cette étude de fin 2024
            </a>.
          </p>

          <footer className="mt-8 border-t pt-4 text-sm text-gray-600">
            <p>
              Réalisé avec ❤️ et entrain, par
               <a href="https://www.linkedin.com/in/matthieuchatry/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Matthieu Chatry
              </a> – 
               <a href="mailto:matthieu@amuseurs.fr" className="hover:underline">matthieu@amuseurs.fr</a> –
               <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="hover:underline">sur Bolt.new</a>
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}

export default App;