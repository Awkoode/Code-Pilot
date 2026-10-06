{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}

module Types where

import Data.Aeson (FromJSON, ToJSON)
import Data.Text (Text)
import GHC.Generics (Generic)

data FileInput = FileInput
  { relativePath :: Text
  , content      :: Text
  } deriving (Show, Generic)

instance FromJSON FileInput
instance ToJSON FileInput

data AnalyzeRequest = AnalyzeRequest
  { files :: [FileInput]
  } deriving (Show, Generic)

instance FromJSON AnalyzeRequest

data FileMetric = FileMetric
  { filePath             :: Text
  , totalLines           :: Int
  , codeLines            :: Int
  , commentLines         :: Int
  , blankLines           :: Int
  , cyclomaticComplexity :: Int
  } deriving (Show, Generic)

instance ToJSON FileMetric

data GlobalMetrics = GlobalMetrics
  { totalFilesCount        :: Int
  , totalLinesCount        :: Int
  , totalCodeLines         :: Int
  , totalCommentLines      :: Int
  , totalBlankLines        :: Int
  , avgComplexityPerFile   :: Double
  , healthScore            :: Int
  , fileMetrics            :: [FileMetric]
  } deriving (Show, Generic)

instance ToJSON GlobalMetrics