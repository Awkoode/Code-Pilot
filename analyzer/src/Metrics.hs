{-# LANGUAGE OverloadedStrings #-}

module Metrics (analyzeProject) where

import Types
import Data.Text (Text)
import qualified Data.Text as T

analyzeFile :: FileInput -> FileMetric
analyzeFile file =
  let rawContent = content file
      lineList   = T.lines rawContent
      tLines     = length lineList
      bLines     = length $ filter T.null (map T.strip lineList)
      cLines     = length $ filter isCommentLine lineList
      codeL      = tLines - bLines - cLines
      complexity = calculateComplexity rawContent
  in FileMetric
      { filePath             = relativePath file
      , totalLines           = tLines
      , codeLines            = codeL
      , commentLines         = cLines
      , blankLines           = bLines
      , cyclomaticComplexity = max 1 complexity
      }

isCommentLine :: Text -> Bool
isCommentLine line =
  let trimmed = T.strip line
  in T.isPrefixOf "//" trimmed
     || T.isPrefixOf "#" trimmed
     || T.isPrefixOf "/*" trimmed
     || T.isPrefixOf "*" trimmed
     || T.isPrefixOf "--" trimmed

calculateComplexity :: Text -> Int
calculateComplexity txt =
  let tokens = T.words txt
      keywords = ["if", "else", "for", "while", "switch", "case", "catch", "&&", "||", "?", "guard"]
      countKeyword kw = length $ filter (== kw) tokens
  in 1 + sum (map countKeyword keywords)

analyzeProject :: [FileInput] -> GlobalMetrics
analyzeProject fileInputs =
  let metrics = map analyzeFile fileInputs
      fCount  = length metrics
      tLines  = sum $ map totalLines metrics
      cCode   = sum $ map codeLines metrics
      cComm   = sum $ map commentLines metrics
      cBlank  = sum $ map blankLines metrics
      tComp   = sum $ map cyclomaticComplexity metrics
      maxComp = if null metrics then 0 else maximum (map cyclomaticComplexity metrics)
      avgComp = if fCount > 0 then fromIntegral tComp / fromIntegral fCount else 0.0
      score   = calculateHealthScore fCount tLines cCode cComm avgComp (fromIntegral maxComp)
  in GlobalMetrics
      { totalFilesCount      = fCount
      , totalLinesCount      = tLines
      , totalCodeLines       = cCode
      , totalCommentLines    = cComm
      , totalBlankLines      = cBlank
      , avgComplexityPerFile = avgComp
      , healthScore          = score
      , fileMetrics          = metrics
      }

-- | Score determinístico de manutenibilidade.
--
-- A primeira versão somava um bônus de documentação a 100 e só penalizava
-- complexidade acima de 15. O clamp em 100 devolvia 100 para praticamente
-- todo repositório, então o número não distinguia nada.
--
-- Agora o score é uma média ponderada de quatro dimensões normalizadas.
-- Cada dimensão vale no máximo o próprio peso e nunca zera de vez (piso de
-- 10%), o que faz o resultado espalhar em vez de encostar nos extremos.
--
-- Esta métrica mede apenas sinais objetivos de manutenibilidade. Ela não
-- substitui a avaliação de arquitetura/segurança feita pela IA.
calculateHealthScore :: Int -> Int -> Int -> Int -> Double -> Double -> Int
calculateHealthScore files totalLines codeLines commentLines avgComp maxComp
  | files == 0 = 0
  | otherwise =
      let code        = max 1 codeLines
          docRatio    = fromIntegral commentLines / fromIntegral code
          avgFileSize = fromIntegral totalLines / fromIntegral files

          -- complexidade média: 1 em <=5, 0 em >=15
          complexity = norm 5.0 15.0 avgComp
          -- complexidade máxima: 1 em <=15, 0 em >=45
          maxComplexity = norm 15.0 45.0 maxComp
          -- documentação: 1 em >=8% de linhas comentadas
          documentation = clampUnit (docRatio / 0.08)
          -- tamanho médio do arquivo: 1 em <=300 linhas, 0 em >=600
          fileSize = norm 300.0 600.0 avgFileSize

          weighted = 35.0 * complexity
                   + 20.0 * maxComplexity
                   + 25.0 * documentation
                   + 20.0 * fileSize
      in max 0 (min 100 (round weighted))

-- | Normaliza um valor: 1.0 até 'good', 0.0 a partir de 'bad'.
-- Piso de 10% para nenhuma dimensão zerar completamente.
norm :: Double -> Double -> Double -> Double
norm good bad v
  | v <= good = 1.0
  | v >= bad  = 0.1
  | otherwise = 0.1 + 0.9 * (bad - v) / (bad - good)

-- | Limita um valor ao intervalo 0..1.
clampUnit :: Double -> Double
clampUnit v = max 0.0 (min 1.0 v)