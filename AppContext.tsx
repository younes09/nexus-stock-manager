
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Product, Entity, Invoice, AppState, Category, User as UserType, PaginatedResponse } from './types';
import { useNavigate } from 'react-router-dom';

interface AppContextType {
    state: AppState;
    isLoading: boolean;
    isSyncing: boolean;
    fetchData: (silent?: boolean) => Promise<void>;
    fetchInvoices: (page: number, limit: number) => Promise<void>;
    fetchCash: (page: number, limit: number) => Promise<void>;
    login: (user: UserType) => void;
    logout: () => Promise<void>;
    addProduct: (p: Product) => Promise<void>;
    updateProduct: (p: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addEntity: (e: Entity) => Promise<void>;
    updateEntity: (e: Entity) => Promise<void>;
    deleteEntity: (id: string) => Promise<void>;
    addCategory: (c: Category) => Promise<void>;
    updateCategory: (c: Category) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addInvoice: (inv: Invoice) => Promise<void>;
    updateInvoice: (inv: Invoice) => Promise<void>;
    addCashTransaction: (t_item: any) => Promise<void>;
    deleteCashTransaction: (id: string) => Promise<void>;
    showDialog: (config: any) => void;
    hideDialog: () => void;
    dialogConfig: any;
}

const INITIAL_DATA: AppState = {
    products: [],
    entities: [],
    invoices: { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } },
    categories: [],
    cashTransactions: { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } },
    user: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const navigate = useNavigate();

    const showDialog = useCallback((config: any) => {
        setDialogConfig({ ...config, isOpen: true });
    }, []);

    const hideDialog = useCallback(() => {
        setDialogConfig((prev: any) => ({ ...prev, isOpen: false }));
    }, []);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [products, categories, entities, invoices, cashTransactions] = await Promise.all([
                api.products.get(),
                api.categories.get(),
                api.entities.get(),
                api.invoices.get(1, 50),
                api.cash.get(1, 50),
            ]);

            setState(prev => ({
                ...prev,
                products: (products as any[])?.map(p => ({
                    ...p,
                    minStock: p.min_stock,
                    expiryDate: p.expiry_date
                })) || [],
                categories: (categories as Category[]) || [],
                entities: (entities as Entity[]) || [],
                invoices: {
                    pagination: (invoices as any)?.pagination || INITIAL_DATA.invoices.pagination,
                    data: ((invoices as any)?.data as any[])?.map(inv => ({
                        ...inv,
                        entityId: inv.entity_id,
                        entityName: inv.entity_name,
                        paidAmount: inv.paid_amount || 0,
                        items: (inv.items as any[])?.map(item => ({
                            ...item,
                            productId: item.productId,
                            productName: item.productName,
                            unitPrice: item.unitPrice,
                            cost: item.cost || 0,
                            total: item.total
                        })) || []
                    })) || []
                },
                cashTransactions: (cashTransactions as any) || INITIAL_DATA.cashTransactions,
            }));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    const fetchInvoices = async (page: number, limit: number) => {
        setIsSyncing(true);
        try {
            const res: any = await api.invoices.get(page, limit);
            setState(prev => ({
                ...prev,
                invoices: {
                    pagination: res.pagination,
                    data: (res.data as any[]).map(inv => ({
                        ...inv,
                        entityId: inv.entity_id,
                        entityName: inv.entity_name,
                        paidAmount: inv.paid_amount || 0,
                        items: (inv.items as any[]).map(item => ({
                            ...item,
                            productId: item.productId,
                            productName: item.productName,
                            unitPrice: item.unitPrice,
                            cost: item.cost || 0,
                            total: item.total
                        }))
                    }))
                }
            }));
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchCash = async (page: number, limit: number) => {
        setIsSyncing(true);
        try {
            const res: any = await api.cash.get(page, limit);
            setState(prev => ({
                ...prev,
                cashTransactions: {
                    pagination: res.pagination,
                    data: res.data
                }
            }));
        } finally {
            setIsSyncing(false);
        }
    };

    // Auth
    useEffect(() => {
        api.auth.session()
            .then((res: any) => {
                if (res.user) {
                    setState(prev => ({
                        ...prev,
                        user: { ...res.user, role: res.user.role || 'authorized' }
                    }));
                    fetchData();
                } else {
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error('Session check failed:', err);
                setIsLoading(false);
            });
    }, [fetchData]);

    const login = (user: UserType) => {
        setState(prev => ({ ...prev, user }));
        navigate('/');
    };

    const logout = async () => {
        try { await api.auth.logout(); } finally {
            setState(prev => ({ ...prev, user: null }));
            navigate('/');
        }
    };

    // Mutators
    const addProduct = async (p: Product) => {
        setIsSyncing(true);
        try { await api.products.create(p); await fetchData(true); }
        catch (err) { showDialog({ title: 'Error', message: 'Failed to add product.', onConfirm: hideDialog, isAlert: true, variant: 'danger' }); }
        finally { setIsSyncing(false); }
    };

    const updateProduct = async (p: Product) => {
        setIsSyncing(true);
        try { await api.products.update(p); await fetchData(true); }
        catch (err) { showDialog({ title: 'Error', message: 'Failed to update product.', onConfirm: hideDialog, isAlert: true, variant: 'danger' }); }
        finally { setIsSyncing(false); }
    };

    const deleteProduct = async (id: string) => {
        const isUsed = state.invoices.data.some(inv => inv.items.some(item => item.productId === id));
        if (isUsed) {
            showDialog({ title: 'Protected Item', message: "Cannot delete product in use.", onConfirm: hideDialog, isAlert: true, variant: 'warning' });
            return;
        }
        setIsSyncing(true);
        try { await api.products.delete(id); await fetchData(true); }
        catch (err) { showDialog({ title: 'Error', message: 'Failed to delete product.', onConfirm: hideDialog, isAlert: true, variant: 'danger' }); }
        finally { setIsSyncing(false); }
    };

    const addEntity = async (e: Entity) => {
        setIsSyncing(true);
        try { await api.entities.create(e); await fetchData(true); }
        catch (err) { showDialog({ title: 'Error', message: 'Failed to add entity.', onConfirm: hideDialog, isAlert: true, variant: 'danger' }); }
        finally { setIsSyncing(false); }
    };

    const updateEntity = async (e: Entity) => {
        setIsSyncing(true);
        try { await api.entities.update(e); await fetchData(true); }
        catch (err) { showDialog({ title: 'Error', message: 'Failed to update entity.', onConfirm: hideDialog, isAlert: true, variant: 'danger' }); }
        finally { setIsSyncing(false); }
    };

    const deleteEntity = async (id: string) => {
        const isUsed = state.invoices.data.some(inv => inv.entityId === id);
        if (isUsed) {
            showDialog({ title: 'Error', message: "Entity in use.", onConfirm: hideDialog, isAlert: true, variant: 'warning' });
            return;
        }
        setIsSyncing(true);
        try { await api.entities.delete(id); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const addCategory = async (c: Category) => {
        setIsSyncing(true);
        try { await api.categories.create(c); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const updateCategory = async (c: Category) => {
        setIsSyncing(true);
        try { await api.categories.update(c); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const deleteCategory = async (id: string) => {
        setIsSyncing(true);
        try { await api.categories.delete(id); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const addInvoice = async (inv: Invoice) => {
        setIsSyncing(true);
        try { await api.invoices.create(inv); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const updateInvoice = async (inv: Invoice) => {
        setIsSyncing(true);
        try { await api.invoices.update(inv); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const addCashTransaction = async (t_item: any) => {
        setIsSyncing(true);
        try { await api.cash.create(t_item); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    const deleteCashTransaction = async (id: string) => {
        setIsSyncing(true);
        try { await api.cash.delete(id); await fetchData(true); }
        finally { setIsSyncing(false); }
    };

    return (
        <AppContext.Provider value={{
            state, isLoading, isSyncing, fetchData, fetchInvoices, fetchCash,
            login, logout, addProduct, updateProduct, deleteProduct,
            addEntity, updateEntity, deleteEntity, addCategory, updateCategory, deleteCategory,
            addInvoice, updateInvoice, addCashTransaction, deleteCashTransaction,
            showDialog, hideDialog, dialogConfig
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppContext must be used within AppProvider');
    return context;
};
