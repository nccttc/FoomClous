import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, CheckSquare } from "lucide-react";
import { Button } from "./Button";

interface BulkActionToolbarProps {
    selectedFilesCount: number;
    selectedFoldersCount: number;
    onDelete: () => void;
    onCancel: () => void;
    isVisible: boolean;
}

export const BulkActionToolbar = ({
    selectedFilesCount,
    selectedFoldersCount,
    onDelete,
    onCancel,
    isVisible
}: BulkActionToolbarProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
                >
                    <div className="bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-xl">
                                <CheckSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold truncate">
                                    已选择 {selectedFilesCount + selectedFoldersCount} 个项目
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    {selectedFoldersCount} 文件夹 • {selectedFilesCount} 文件
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-xs flex items-center gap-2 hover:bg-muted"
                                onClick={onCancel}
                            >
                                <X className="h-4 w-4" />
                                <span>取消</span>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-9 px-4 text-xs flex items-center gap-2 shadow-lg shadow-red-500/20"
                                onClick={onDelete}
                                disabled={selectedFilesCount + selectedFoldersCount === 0}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>删除所选</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
