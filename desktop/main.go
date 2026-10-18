package main

import (
 "archive/zip"
 "bytes"
 _ "embed"
 "io"
 "io/fs"
 "net"
 "net/http"
 "os"
 "path/filepath"
 "strings"
 "time"
)

//go:embed web.zip
var bundle []byte
const address = "127.0.0.1:18765"
const origin = "http://"+address
func main(){
 if (len(os.Args)<2 || os.Args[1]!="--run") && strings.Contains(strings.ToLower(filepath.Base(os.Args[0])),"setup") { if err:=install();err!=nil{alert("Installation failed: "+err.Error())};return }
 archive,err:=zip.NewReader(bytes.NewReader(bundle),int64(len(bundle)));if err!=nil{alert(err.Error());return}
 listener,err:=net.Listen("tcp",address)
 if err!=nil { client:=http.Client{Timeout:time.Second};response,e:=client.Get(origin+"/desktop-health");if e==nil{defer response.Body.Close();body,_:=io.ReadAll(response.Body);if string(body)=="ultimate-topology-desktop-v45"{openBrowser(origin+"/studio.html");return}};alert("Local port 18765 is occupied. Close the previous app or free this port.");return }
 files:=http.FileServer(http.FS(archive));server:=&http.Server{ReadHeaderTimeout:5*time.Second}
 server.Handler=http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  if r.Host!=address {http.Error(w,"Invalid host",403);return}
  w.Header().Set("X-Content-Type-Options","nosniff")
  if r.URL.Path=="/desktop-health" {w.Write([]byte("ultimate-topology-desktop-v45"));return}
  if r.URL.Path=="/desktop-stop" {if r.Method!="POST"||r.Header.Get("Origin")!=origin{http.Error(w,"Forbidden",403);return};w.Write([]byte("Stopped"));go func(){time.Sleep(150*time.Millisecond);server.Close()}();return}
  if strings.HasPrefix(r.URL.Path,"/api/"){w.Header().Set("Content-Type","application/json");w.WriteHeader(503);w.Write([]byte(`{"error":"Shared Reviews are unavailable in Offline mode"}`));return}
  if r.URL.Path=="/" {http.Redirect(w,r,"/studio.html",302);return}
  if strings.HasSuffix(strings.ToLower(r.URL.Path),".pptx"){http.NotFound(w,r);return}
  if _,err:=fs.Stat(archive,strings.TrimPrefix(r.URL.Path,"/"));err!=nil{http.NotFound(w,r);return}
  files.ServeHTTP(w,r)
 })
 go openBrowser(origin+"/studio.html")
 server.Serve(listener)
}
