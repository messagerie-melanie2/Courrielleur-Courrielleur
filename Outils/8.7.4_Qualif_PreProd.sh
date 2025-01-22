#!/bin/bash
#
# modifie l'environnement du courrielleur 8.7.4 de Qualif vers PreProd

PS3="Modifier l'environnement du dépôt courrielleur de Qualif vers PreProd ?"

rep=$(dirname $0)

# chemin du courrielleur relatif au chemin du script dans le dépôt git
# on a typiquement l'arborescence suivante:
# courrielleur-a-plat
# |_mi-courrielleur-8.7.4_win64_plat
# |_mi-courrielleur-xxx_win64_plat
# |_Outils
chemin=$rep"/../mi-courrielleur-8.7.4_win64_plat"

# urls/valeurs originales
source $rep/urls-Qualif.txt

# urls/valeurs finales
source $rep/urls-PreProd.txt


# chemin courrielleur
source $rep/modifUrls.sh

ModifieUrls chemin urls_QUALIF urls_PreProd

