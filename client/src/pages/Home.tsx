import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

interface Player {
  nome: string;
  idade: number | string;
  overall: number | string;
  potencial: number | string;
  time: string;
  posicoes: string[];
  pais?: string;
  imagem?: string;
  valorMercado?: string;
}

interface Team {
  nome: string;
  liga: string;
  orcamento: string;
  valorClube: string;
  nacionalidade: string;
  logo?: string;
  bandeira?: string;
}

interface ScraperResult {
  success: boolean;
  error: string | null;
  players: Player[];
  count?: number;
}

interface TeamResult {
  success: boolean;
  error: string | null;
  teams: Team[];
  count?: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'players' | 'teams'>('players');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [startOffset, setStartOffset] = useState(0);
  const [endOffset, setEndOffset] = useState(60);

  const extractMutation = trpc.scraper.extractPlayers.useMutation();
  const extractBatchMutation = trpc.scraper.extractPlayersBatch.useMutation();
  const downloadImagesMutation = trpc.scraper.downloadImages.useMutation();
  const extractTeamsMutation = trpc.scraper.extractTeams.useMutation();
  const downloadTeamImagesMutation = trpc.scraper.downloadTeamImages.useMutation();

  const handleExtract = async () => {
    setError(null);
    setPlayers([]);

    if (!url.trim()) {
      setError("Por favor, cole uma URL do SoFIFA");
      return;
    }

    if (!url.includes("sofifa.com")) {
      setError("A URL deve ser do site sofifa.com");
      return;
    }

    setIsLoading(true);

    try {
      const result = (await extractMutation.mutateAsync({ url })) as ScraperResult;

      if (!result.success) {
        setError(result.error || "Erro desconhecido ao extrair dados");
        return;
      }

      setPlayers(result.players || []);
      toast.success(`${result.count || result.players?.length || 0} jogadores extraídos com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao extrair dados";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractBatch = async () => {
    setError(null);
    setPlayers([]);

    if (!url.trim()) {
      setError("Por favor, cole uma URL do SoFIFA");
      return;
    }

    if (!url.includes("sofifa.com")) {
      setError("A URL deve ser do site sofifa.com");
      return;
    }

    if (startOffset < 0 || endOffset < startOffset) {
      setError("Intervalo de offsets inválido");
      return;
    }

    if (endOffset - startOffset > 600) {
      setError("Intervalo muito grande. Máximo de 600 offsets por vez");
      return;
    }

    setIsLoading(true);

    try {
      const result = (await extractBatchMutation.mutateAsync({
        baseUrl: url,
        startOffset,
        endOffset,
        step: 60,
      })) as ScraperResult;

      if (!result.success) {
        setError(result.error || "Erro desconhecido ao extrair dados em lote");
        return;
      }

      setPlayers(result.players || []);
      toast.success(`${result.count || result.players?.length || 0} jogadores extraídos com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao extrair dados em lote";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (players.length === 0) {
      toast.error("Nenhum dado para baixar");
      return;
    }

    const jsonData = JSON.stringify(players, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sofifa_players_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo JSON baixado com sucesso!");
  };

  const handleDownloadImages = async () => {
    if (players.length === 0) {
      toast.error("Nenhum jogador para baixar imagens");
      return;
    }

    const playersWithImages = players.filter((p: Player) => p.imagem);
    if (playersWithImages.length === 0) {
      toast.error("Nenhuma imagem disponível para download");
      return;
    }

    try {
      const result = await downloadImagesMutation.mutateAsync({ players: playersWithImages });
      
      if (result.success && result.data) {
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `imagens_jogadores_${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${playersWithImages.length} imagens baixadas com sucesso!`);
      } else {
        toast.error(result.message || "Erro ao fazer download das imagens");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer download das imagens";
      toast.error(errorMessage);
    }
  };

  const handleExtractTeams = async () => {
    setError(null);
    setTeams([]);

    if (!url.trim()) {
      setError("Por favor, cole uma URL do SoFIFA");
      return;
    }

    if (!url.includes("sofifa.com")) {
      setError("A URL deve ser do site sofifa.com");
      return;
    }

    setIsLoading(true);

    try {
      const result = (await extractTeamsMutation.mutateAsync({ url })) as TeamResult;

      if (!result.success) {
        setError(result.error || "Erro desconhecido ao extrair dados");
        return;
      }

      setTeams(result.teams || []);
      toast.success(`${result.count || result.teams?.length || 0} times extraídos com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao extrair dados";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTeamsJSON = () => {
    if (teams.length === 0) {
      toast.error("Nenhum dado para baixar");
      return;
    }

    const jsonData = JSON.stringify(teams, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sofifa_teams_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo JSON baixado com sucesso!");
  };

  const handleDownloadTeamImages = async () => {
    if (teams.length === 0) {
      toast.error("Nenhum time para baixar imagens");
      return;
    }

    const teamsWithImages = teams.filter((t: Team) => t.logo || t.bandeira);
    if (teamsWithImages.length === 0) {
      toast.error("Nenhuma imagem disponível para download");
      return;
    }

    try {
      const result = await downloadTeamImagesMutation.mutateAsync({ teams: teamsWithImages });
      
      if (result.success && result.data) {
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `imagens_times_${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${teamsWithImages.length} times com imagens baixados com sucesso!`);
      } else {
        toast.error(result.message || "Erro ao fazer download das imagens");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer download das imagens";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SoFIFA Web Scraper</h1>
          <p className="text-slate-600">Extraia dados de jogadores do SoFIFA e gere um arquivo JSON estruturado</p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setMode('players')}
              variant={mode === 'players' ? "default" : "outline"}
              className={mode === 'players' ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Jogadores
            </Button>
            <Button
              onClick={() => setMode('teams')}
              variant={mode === 'teams' ? "default" : "outline"}
              className={mode === 'teams' ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Times
            </Button>
          </div>
          {mode === 'players' && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setIsBatchMode(false)}
                variant={!isBatchMode ? "default" : "outline"}
                className={!isBatchMode ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Extração Simples
              </Button>
              <Button
                onClick={() => setIsBatchMode(true)}
                variant={isBatchMode ? "default" : "outline"}
                className={isBatchMode ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Extração em Lote
              </Button>
            </div>
          )}
        </div>

        {/* Input Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>
              {mode === 'teams'
                ? "Extrair Times"
                : isBatchMode
                ? "Extrair Jogadores em Lote"
                : "Extrair Jogadores"}
            </CardTitle>
            <CardDescription>
              {mode === 'teams'
                ? "Cole a URL da página de times do SoFIFA que deseja extrair"
                : isBatchMode
                ? "Extraia múltiplas páginas consecutivas fornecendo um intervalo de offsets"
                : "Cole a URL da página do SoFIFA que deseja extrair"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">URL do SoFIFA</label>
              <Input
                placeholder="https://sofifa.com/players?type=all&aeh=23&col=pt&sort=desc&offset=60"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="bg-white"
              />
            </div>

            {isBatchMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Offset Inicial</label>
                    <Input
                      type="number"
                      value={startOffset}
                      onChange={(e) => setStartOffset(Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={isLoading}
                      className="bg-white"
                      min="0"
                      step="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Offset Final</label>
                    <Input
                      type="number"
                      value={endOffset}
                      onChange={(e) => setEndOffset(Math.max(startOffset, parseInt(e.target.value) || 0))}
                      disabled={isLoading}
                      className="bg-white"
                      min="0"
                      step="60"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Cada página contém ~60 jogadores. Use offsets em múltiplos de 60 (0, 60, 120, 180...).
                    Máximo de 600 offsets por vez (10 páginas).
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={mode === 'teams' ? handleExtractTeams : isBatchMode ? handleExtractBatch : handleExtract}
              disabled={isLoading || !url.trim()}
              className={`w-full text-white ${
                mode === 'teams'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'teams'
                    ? "Extraindo times..."
                    : isBatchMode
                    ? "Extraindo em lote..."
                    : "Extraindo..."}
                </>
              ) : (
                mode === 'teams'
                  ? "Extrair Times"
                  : isBatchMode
                  ? "Extrair em Lote"
                  : "Extrair Jogadores"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {players.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Resultados da Extração
                </CardTitle>
                <CardDescription>{players.length} jogadores encontrados</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadJSON}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar JSON
                </Button>
                <Button
                  onClick={handleDownloadImages}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                  disabled={downloadImagesMutation.isPending}
                >
                  {downloadImagesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Imagens (ZIP)
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Imagem</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Idade</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Overall</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Potencial</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">País</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Valor Mercado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Posições</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-center">
                          {player.imagem ? (
                            <img src={player.imagem} alt={player.nome} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">{player.nome}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{player.idade}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                            {player.overall}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
                            {player.potencial}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{player.time}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {player.pais ? (
                            <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium text-xs">
                              {player.pais}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {player.valorMercado ? (
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                              {player.valorMercado}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {player.posicoes.map((pos, posIdx) => (
                              <span
                                key={posIdx}
                                className="inline-block bg-slate-200 text-slate-800 px-2 py-1 rounded text-xs font-medium"
                              >
                                {pos}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && players.length === 0 && !error && (
          <Card className="shadow-lg border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">Nenhum dado extraído ainda</p>
              <p className="text-sm text-slate-400">
                {isBatchMode
                  ? "Cole uma URL do SoFIFA, defina o intervalo de offsets e clique em 'Extrair em Lote' para começar"
                  : "Cole uma URL do SoFIFA e clique em 'Extrair Jogadores' para começar"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
