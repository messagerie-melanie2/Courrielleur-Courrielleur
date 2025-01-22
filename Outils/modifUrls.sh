#!/bin/bash
#
# fonction utilisée pour modifier les urls du courrielleur
# permet de changer d'environnement

# fichiers à modifier
source $rep/fichiersUrls.txt

# arguments
# $1 : chemin courrielleur
# $2 : tableau urls source
# $3 : tableau urls destination 
function ModifieUrls(){

	select confirme in OUI NON
	do
			case $confirme in
					"OUI")
						break;;
					"NON")
						exit;;
					*)
						exit;;
			esac
	done

	typeset -n rep=$1 urlsrc=$2 urldest=$3
	
	nb="${src[@]}"
	#echo "nb:"$nb
	index=0
	
	echo  "modification de:"$rep
	echo

	for i in "${urlsrc[@]}";
	do
		src=$i
		dest=${urldest[$index]}
		fichier=${fichiers[$index]}
		
		echo "Modification du fichier :"$fichier
		echo "  "$src
		echo "  =>"
		echo "  "$dest
		echo
		
		sed -i 's/'$src'/'$dest'/g' $chemin"/"$fichier
		
		let "index = $index + 1"
	done
	
	echo "Modifications terminées"
}
