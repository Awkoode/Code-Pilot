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
      avgComp = if fCount > 0 then fromIntegral tComp / fromIntegral fCount else 0.0
      score   = calculateHealthScore fCount tLines cComm avgComp
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

calculateHealthScore :: Int -> Int -> Int -> Double -> Int
calculateHealthScore files countLines comments avgComp
  | files == 0 = 100
  | otherwise  =
      let commentRatio = if countLines > 0 then (fromIntegral comments / fromIntegral countLines) * 100.0 else 0.0
          penaltyComp  = if avgComp > 15.0 then (avgComp - 15.0) * 2.0 else 0.0
          baseScore    = 100.0 - penaltyComp + (min 15.0 commentRatio)
      in max 0 (min 100 (round baseScore))