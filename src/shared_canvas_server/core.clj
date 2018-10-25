(ns shared-canvas-server.core
  (:gen-class)
  (:require [org.httpkit.server :refer :all]
            [compojure.core :refer [GET defroutes]]
            [compojure.route :refer [not-found]]
            [clojure.data.json :as json]
            [ring.middleware.resource :refer [wrap-resource]]
            [ring.middleware.content-type :refer [wrap-content-type]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.util.response :as resp]))  

(defonce canvas-events (atom []))

(defn handle-message
  [message]
  (println "Received:" message)
  (swap! canvas-events conj (json/read-str message)))

(defn websocket-handler
  [request]
  (with-channel request channel
    (println "New user connected")
    (println "Sending canvas events")
    (send! channel (json/write-str @canvas-events))
    (on-close channel (fn [status] (println "channel closed:" status)))
    (on-receive channel handle-message)))

(defroutes routes
  (GET "/ws" [] websocket-handler)
  (not-found "Not found"))

(defn wrap-root-to-index
  [handler]
  (fn [request]
    (handler (update-in request [:uri]
               #(if (= "/" %) "/index.html" %)))))

(def app
  (-> routes
      (wrap-resource "public")
      (wrap-content-type)
      (wrap-not-modified)
      (wrap-root-to-index)))

;;;; Server

(defonce server (atom nil))

(defn stop-server []
  (when-not (nil? @server)
    (@server :timeout 100)
    (reset! server nil)))

(defn start-server
  [port]
  (reset! server (run-server #'app {:port port})))

(defn -main
  [& args]
  (start-server 8000)
  (println "Server running on port 8000"))
