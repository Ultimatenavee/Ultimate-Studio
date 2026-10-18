package main
import("os";"os/exec";"path/filepath";"syscall";"unsafe";"encoding/base64";"encoding/binary";"unicode/utf16";"fmt")
var user32=syscall.NewLazyDLL("user32.dll")
func message(text string,flags uintptr)uintptr{t,_:=syscall.UTF16PtrFromString(text);title,_:=syscall.UTF16PtrFromString("Ultimate Topology Studio");r,_,_:=user32.NewProc("MessageBoxW").Call(0,uintptr(unsafe.Pointer(t)),uintptr(unsafe.Pointer(title)),flags);return r}
func alert(text string){message(text,0x10)}
func openBrowser(url string){exec.Command("rundll32.exe","url.dll,FileProtocolHandler",url).Start()}
func quotePS(s string)string{return "'"+escapePS(s)+"'"}
func escapePS(s string)string{out:="";for _,c:=range s{out+=string(c);if c=='\''{out+="'"}};return out}
func powershell(script string)error{units:=utf16.Encode([]rune(script));raw:=make([]byte,len(units)*2);for i,u:=range units{binary.LittleEndian.PutUint16(raw[i*2:],u)};cmd:=exec.Command("powershell.exe","-NoProfile","-NonInteractive","-EncodedCommand",base64.StdEncoding.EncodeToString(raw));cmd.SysProcAttr=&syscall.SysProcAttr{HideWindow:true};return cmd.Run()}
func install()error{
 if message("Install Ultimate Topology Studio for this Windows user?\n\nWorks Offline in your default browser. Templates stay on this PC. No administrator rights required.",0x24)!=6{return nil}
 root:=filepath.Join(os.Getenv("LOCALAPPDATA"),"UltimateTopologyStudio");if err:=os.MkdirAll(root,0700);err!=nil{return err}
 source,err:=os.Executable();if err!=nil{return err};data,err:=os.ReadFile(source);if err!=nil{return err};target:=filepath.Join(root,"UltimateTopologyStudio.exe");if err=os.WriteFile(target,data,0700);err!=nil{return fmt.Errorf("close the running app before updating: %w",err)}
 script:="$ErrorActionPreference='Stop';$w=New-Object -ComObject WScript.Shell;foreach($folder in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){$s=$w.CreateShortcut((Join-Path $folder 'Ultimate Topology Studio.lnk'));$s.TargetPath="+quotePS(target)+";$s.Arguments='--run';$s.WorkingDirectory="+quotePS(root)+";$s.Save()}"
 if err=powershell(script);err!=nil{return err}
 os.WriteFile(filepath.Join(root,"UNINSTALL.txt"),[]byte("Stop the app with the Stop Desktop button, delete this installation folder, then delete Ultimate Topology Studio shortcuts from Desktop and Start Menu. Browser data is retained; export JSON before clearing browser storage."),0600)
 if message("Installation complete.\n\nOpen Ultimate Topology Studio now?",0x24)==6{return exec.Command(target,"--run").Start()};return nil
}
