{-# LANGUAGE OverloadedStrings #-}

module Server (startServer) where

import Types
import Metrics (analyzeProject)
import qualified Web.Scotty as S
import Data.Aeson (object, (.=))
import Network.Wai.Middleware.RequestLogger (logStdoutDev)

startServer :: Int -> IO ()
startServer port = S.scotty port $ do
  S.middleware logStdoutDev

  S.get "/health" $ do
    S.json $ object ["status" .= ("ok" :: String), "service" .= ("haskell-analyzer" :: String)]

  S.post "/analyze" $ do
    req <- S.jsonData :: S.ActionM AnalyzeRequest
    let result = analyzeProject (files req)
    S.json result