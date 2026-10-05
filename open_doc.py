import webbrowser
import os

html_file = os.path.abspath(r"C:\Users\Sankar.A\Downloads\Royal_Bikes-main (3)\Royal_Bikes-main\Royal_Bikes_Documentation.html")
webbrowser.open(f"file:///{html_file}")
print("Browser-ல் திறந்தது! Print dialog வரும் — Save as PDF select பண்ணுங்கள்.")
