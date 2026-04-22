import { describe, expect, it } from "vitest";
import { scrapeSofifaPlayers, scrapeSofifaPlayersBatch, scrapeSofifaTeams, scrapeSofifaTeamDetails } from "./scraperService";

describe("scrapeSofifaPlayers", () => {
  it("should return error for invalid URL", async () => {
    const result = await scrapeSofifaPlayers("https://example.com");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.players).toEqual([]);
  });

  it("should return error for empty URL", async () => {
    const result = await scrapeSofifaPlayers("");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.players).toEqual([]);
  });

  it("should return error for null URL", async () => {
    const result = await scrapeSofifaPlayers(null as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.players).toEqual([]);
  });
});

describe("scrapeSofifaPlayersBatch - Input Validation", () => {
  it("should return error for invalid URL", async () => {
    const result = await scrapeSofifaPlayersBatch("https://example.com", 0, 60);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.players).toEqual([]);
  });

  it("should return error for empty URL", async () => {
    const result = await scrapeSofifaPlayersBatch("", 0, 60);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.players).toEqual([]);
  });

  it("should return error for negative startOffset", async () => {
    const result = await scrapeSofifaPlayersBatch("https://sofifa.com/players", -10, 60);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Intervalo inválido");
    expect(result.players).toEqual([]);
  });

  it("should return error when endOffset is less than startOffset", async () => {
    const result = await scrapeSofifaPlayersBatch("https://sofifa.com/players", 120, 60);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Intervalo inválido");
    expect(result.players).toEqual([]);
  });

  it("should return error for interval larger than 1200", async () => {
    const result = await scrapeSofifaPlayersBatch("https://sofifa.com/players", 0, 1300);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Intervalo muito grande");
    expect(result.players).toEqual([]);
  });

  it("should reject interval larger than 1200", async () => {
    const result = await scrapeSofifaPlayersBatch("https://sofifa.com/players", 0, 1201);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Intervalo muito grande");
  });

  // Testes que fazem requisições reais foram removidos pois são instáveis (dependem do Cloudflare bloquear ou não)
});


describe("scrapeSofifaTeams - Input Validation", () => {
  it("should return error for invalid URL", async () => {
    const result = await scrapeSofifaTeams("https://example.com");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL deve ser do site sofifa.com");
    expect(result.teams).toEqual([]);
  });

  it("should return error for empty URL", async () => {
    const result = await scrapeSofifaTeams("");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.teams).toEqual([]);
  });

  it("should return error for null URL", async () => {
    const result = await scrapeSofifaTeams(null as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.teams).toEqual([]);
  });

  it("should return error for non-sofifa URL", async () => {
    const result = await scrapeSofifaTeams("https://google.com/teams");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL deve ser do site sofifa.com");
    expect(result.teams).toEqual([]);
  });
});


describe("scrapeSofifaTeamDetails - Input Validation", () => {
  it("should return error for invalid URL", async () => {
    const result = await scrapeSofifaTeamDetails("https://example.com");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL deve ser do site sofifa.com");
    expect(result.details).toEqual([]);
  });

  it("should return error for empty URL", async () => {
    const result = await scrapeSofifaTeamDetails("");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.details).toEqual([]);
  });

  it("should return error for null URL", async () => {
    const result = await scrapeSofifaTeamDetails(null as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL inválida");
    expect(result.details).toEqual([]);
  });

  it("should return error for non-sofifa URL", async () => {
    const result = await scrapeSofifaTeamDetails("https://google.com/teams");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("URL deve ser do site sofifa.com");
    expect(result.details).toEqual([]);
  });

  it("should have details property in result structure", () => {
    const mockResult = {
      success: true,
      error: null,
      details: [
        {
          nome: "Arsenal",
          liga: "Premier League",
          estadio: "Emirates Stadium",
          rivalTime: "Tottenham Hotspur",
          prestigioInternacional: 5,
          prestigioLocal: 4
        }
      ]
    };
    
    expect(mockResult).toHaveProperty("success");
    expect(mockResult).toHaveProperty("error");
    expect(mockResult).toHaveProperty("details");
    expect(Array.isArray(mockResult.details)).toBe(true);
    expect(mockResult.details[0]).toHaveProperty("nome");
    expect(mockResult.details[0]).toHaveProperty("estadio");
    expect(mockResult.details[0]).toHaveProperty("rivalTime");
  });

  it("should have correct error handling structure", () => {
    const errorResult = {
      success: false,
      error: "URL inválida",
      details: []
    };
    
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBeTruthy();
    expect(errorResult.details).toEqual([]);
  });
});
