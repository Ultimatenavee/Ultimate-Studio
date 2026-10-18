package main
import("fmt";"os";"os/exec")
func alert(text string){fmt.Fprintln(os.Stderr,text)}
func openBrowser(url string){if os.Getenv("UTS_NO_BROWSER")==""{exec.Command("xdg-open",url).Start()}}
func install()error{return fmt.Errorf("installer is Windows only; use --run for local verification")}
