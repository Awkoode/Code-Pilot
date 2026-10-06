module Main where

import Server (startServer)
import System.Environment (lookupEnv)
import Text.Read (readMaybe)

main :: IO ()
main = do
  mPort <- lookupEnv "PORT"
  let port = case mPort >>= readMaybe of
               Just p  -> p
               Nothing -> 8001
  putStrLn $ "Haskell Analyzer iniciado na porta " ++ show port
  startServer port