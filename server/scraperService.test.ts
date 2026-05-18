import { describe, expect, it } from "vitest";
import { scrapeSofifaPlayers, scrapeSofifaPlayersBatch } from "./scraperService";

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


